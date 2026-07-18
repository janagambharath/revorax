"""
Twilio webhook handlers — the nerve center of the product.

Every inbound call and SMS hits these endpoints. This is where
missed calls become leads and revenue gets recovered.

Flow:
1. Call comes in → /voice → smart voicemail
2. Recording completes → /recording-complete → queue transcription
3. Missed call detected → /status → queue auto-text
4. SMS arrives → /sms → AI qualification conversation

Security: All endpoints validate Twilio request signatures.
"""

import logging
from uuid import uuid4

from fastapi import APIRouter, Form, Request, Response, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from twilio.request_validator import RequestValidator

from app.core.config import get_settings
from app.core.database import get_db, async_session
from app.models.models import (
    Business,
    Lead,
    LeadSource,
    LeadStatus,
    Urgency,
    CallLog,
    CallDirection,
    CallStatus as CallStatusEnum,
    SMSMessage,
    SMSDirection,
)
from app.services.twilio_service import (
    generate_voicemail_twiml,
    send_missed_call_text,
    send_sms,
)
from app.services.ai_service import transcribe_audio, qualify_lead, generate_sms_reply
from app.services.notification_service import notify_owner_sms, notify_owner_email

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/webhooks/twilio", tags=["webhooks"])


# ── Twilio Signature Validation ──────────────────────────


async def validate_twilio_request(request: Request) -> None:
    """
    Validate that the request actually came from Twilio.
    Rejects forged webhook requests that could create fake leads
    or trigger unauthorized SMS sends.
    """
    if settings.APP_ENV == "development" and not settings.TWILIO_AUTH_TOKEN:
        # Skip validation in local dev when no Twilio credentials are set
        return

    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)

    # Get the full URL Twilio sent the request to
    url = str(request.url)

    # Get the POST body as a dict
    form_data = await request.form()
    params = {key: form_data[key] for key in form_data}

    # Get the X-Twilio-Signature header
    signature = request.headers.get("X-Twilio-Signature", "")

    if not validator.validate(url, params, signature):
        logger.warning(f"Invalid Twilio signature from {request.client.host}")
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")



async def _get_business_by_number(
    db: AsyncSession, phone_number: str
) -> Business | None:
    """Look up which business owns this Twilio number."""
    result = await db.execute(
        select(Business).where(Business.twilio_phone_number == phone_number)
    )
    return result.scalar_one_or_none()


async def _get_or_create_lead(
    db: AsyncSession,
    business_id,
    caller_phone: str,
    source: LeadSource,
) -> Lead:
    """
    Find an existing lead from this phone number (last 24 hours)
    or create a new one. Avoids duplicate leads from the same caller.
    """
    from datetime import datetime, timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    result = await db.execute(
        select(Lead).where(
            and_(
                Lead.business_id == business_id,
                Lead.caller_phone == caller_phone,
                Lead.created_at >= cutoff,
            )
        ).order_by(Lead.created_at.desc())
    )
    lead = result.scalar_one_or_none()

    if lead:
        return lead

    lead = Lead(
        business_id=business_id,
        source=source,
        caller_phone=caller_phone,
        status=LeadStatus.NEW,
    )
    db.add(lead)
    await db.flush()
    await db.refresh(lead)
    return lead


# ── Voice Webhook ────────────────────────────────────────


@router.post("/voice", dependencies=[Depends(validate_twilio_request)])
async def handle_inbound_call(
    request: Request,
    CallSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    CallStatus: str = Form("ringing"),
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio hits this when a call comes in to our number.
    We respond with TwiML to record a voicemail.
    """
    business = await _get_business_by_number(db, To)
    if not business:
        logger.warning(f"Call to unregistered number: {To}")
        return Response(
            content="<Response><Say>Sorry, this number is not in service.</Say></Response>",
            media_type="application/xml",
        )

    # Log the call
    call_log = CallLog(
        business_id=business.id,
        twilio_call_sid=CallSid,
        direction=CallDirection.INBOUND,
        from_number=From,
        to_number=To,
        status=map_twilio_call_status("ringing"),
    )
    db.add(call_log)

    # Generate voicemail TwiML with business greeting
    twiml = generate_voicemail_twiml(
        greeting=business.greeting_message,
    )

    return Response(content=twiml, media_type="application/xml")


def map_twilio_call_status(twilio_status: str) -> CallStatusEnum:
    """Map Twilio call status string to our enum."""
    mapping = {
        "ringing": CallStatusEnum.MISSED,
        "in-progress": CallStatusEnum.ANSWERED,
        "completed": CallStatusEnum.ANSWERED,
        "no-answer": CallStatusEnum.MISSED,
        "busy": CallStatusEnum.MISSED,
        "failed": CallStatusEnum.MISSED,
    }
    return mapping.get(twilio_status, CallStatusEnum.MISSED)


# ── Recording Complete ───────────────────────────────────


@router.post("/recording-complete", dependencies=[Depends(validate_twilio_request)])
async def handle_recording_complete(
    CallSid: str = Form(...),
    RecordingUrl: str = Form(...),
    RecordingSid: str = Form(...),
    RecordingDuration: str = Form("0"),
    From: str = Form(...),
    To: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Called when a voicemail recording is complete.
    Triggers the transcription → qualification → notification pipeline.
    """
    business = await _get_business_by_number(db, To)
    if not business:
        return {"status": "ignored"}

    # Create/find lead
    lead = await _get_or_create_lead(
        db, business.id, From, LeadSource.VOICEMAIL
    )

    # Update call log with recording info
    result = await db.execute(
        select(CallLog).where(CallLog.twilio_call_sid == CallSid)
    )
    call = result.scalar_one_or_none()
    if call:
        call.recording_url = f"{RecordingUrl}.wav"
        call.recording_sid = RecordingSid
        call.duration_seconds = int(RecordingDuration)
        call.status = CallStatusEnum.VOICEMAIL
        call.lead_id = lead.id

    # Transcribe the voicemail
    transcript = await transcribe_audio(f"{RecordingUrl}.wav")
    if transcript:
        lead.transcript = transcript

        # Qualify the lead
        qualification = await qualify_lead(
            transcript=transcript,
            business_services=business.services_offered,
        )
        lead.caller_name = qualification.get("caller_name")
        lead.service_type = qualification.get("service_type")
        lead.urgency = qualification.get("urgency", "unknown")
        lead.zip_code = qualification.get("zip_code")
        lead.preferred_time = qualification.get("preferred_time")
        lead.ai_summary = qualification.get("summary")

        if call:
            call.transcription = transcript

    # Notify the owner
    from app.models.models import User
    owner_result = await db.execute(
        select(User).where(User.id == business.owner_id)
    )
    owner = owner_result.scalar_one_or_none()

    if owner and owner.phone and business.twilio_phone_number:
        await notify_owner_sms(
            owner_phone=owner.phone,
            business_twilio_number=business.twilio_phone_number,
            lead_name=lead.caller_name,
            lead_phone=lead.caller_phone,
            service_type=lead.service_type,
            urgency=lead.urgency or "unknown",
            summary=lead.ai_summary or "New voicemail received",
        )

    if owner and owner.email:
        await notify_owner_email(
            owner_email=owner.email,
            owner_name=owner.full_name,
            business_name=business.name,
            lead_name=lead.caller_name,
            lead_phone=lead.caller_phone,
            service_type=lead.service_type,
            urgency=lead.urgency or "unknown",
            summary=lead.ai_summary or "New voicemail received",
            transcript=transcript,
        )

    logger.info(f"Voicemail processed for business {business.name}: {lead.ai_summary}")
    return {"status": "processed"}


# ── Call Status Callback ─────────────────────────────────


@router.post("/status", dependencies=[Depends(validate_twilio_request)])
async def handle_call_status(
    CallSid: str = Form(...),
    CallStatus: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    CallDuration: str = Form("0"),
    db: AsyncSession = Depends(get_db),
):
    """
    Called when a call's status changes.
    Key moment: if status is 'no-answer' or 'busy', send auto-text.
    """
    # Update call log
    result = await db.execute(
        select(CallLog).where(CallLog.twilio_call_sid == CallSid)
    )
    call = result.scalar_one_or_none()
    if call:
        call.status = map_twilio_call_status(CallStatus)
        call.duration_seconds = int(CallDuration)

    # If missed call, send auto-text
    if CallStatus in ("no-answer", "busy", "canceled"):
        business = await _get_business_by_number(db, To)
        if business and business.twilio_phone_number:
            # Create a lead for the missed call
            lead = await _get_or_create_lead(
                db, business.id, From, LeadSource.MISSED_CALL
            )
            if call:
                call.lead_id = lead.id

            # Send auto-text within 60 seconds
            msg_sid = await send_missed_call_text(
                to=From,
                from_=business.twilio_phone_number,
                business_name=business.name,
            )

            if msg_sid:
                sms = SMSMessage(
                    business_id=business.id,
                    lead_id=lead.id,
                    twilio_message_sid=msg_sid,
                    direction=SMSDirection.OUTBOUND,
                    from_number=business.twilio_phone_number,
                    to_number=From,
                    body=f"Hi! This is {business.name}. We noticed we missed your call. How can we help you today? Reply with a brief description and we'll get you taken care of right away. Reply STOP to opt out.",
                )
                db.add(sms)

            logger.info(f"Auto-text sent to {From} for missed call to {business.name}")

    return {"status": "ok"}


# ── SMS Webhook ──────────────────────────────────────────


@router.post("/sms", dependencies=[Depends(validate_twilio_request)])
async def handle_inbound_sms(
    From: str = Form(...),
    To: str = Form(...),
    Body: str = Form(...),
    MessageSid: str = Form(""),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle incoming SMS. This is the AI-driven lead qualification flow.

    When someone texts back (either from our auto-text or organically),
    the AI conducts a brief qualification conversation, then notifies
    the owner with the qualified lead.
    """
    business = await _get_business_by_number(db, To)
    if not business:
        logger.warning(f"SMS to unregistered number: {To}")
        return {"status": "ignored"}

    # Get or create lead
    lead = await _get_or_create_lead(
        db, business.id, From, LeadSource.SMS
    )

    # Save inbound message
    inbound_sms = SMSMessage(
        business_id=business.id,
        lead_id=lead.id,
        twilio_message_sid=MessageSid,
        direction=SMSDirection.INBOUND,
        from_number=From,
        to_number=To,
        body=Body,
    )
    db.add(inbound_sms)
    await db.flush()

    # Build conversation history for context
    result = await db.execute(
        select(SMSMessage)
        .where(
            and_(
                SMSMessage.business_id == business.id,
                SMSMessage.lead_id == lead.id,
            )
        )
        .order_by(SMSMessage.created_at.asc())
    )
    messages = result.scalars().all()

    conversation = "\n".join(
        f"{'Customer' if m.direction == SMSDirection.INBOUND else 'Receptionist'}: {m.body}"
        for m in messages
    )

    # Generate AI reply
    reply_text = await generate_sms_reply(
        conversation_history=conversation,
        business_name=business.name,
        business_services=business.services_offered,
    )

    # Send the reply
    msg_sid = await send_sms(
        to=From,
        from_=business.twilio_phone_number,
        body=reply_text,
    )

    if msg_sid:
        outbound_sms = SMSMessage(
            business_id=business.id,
            lead_id=lead.id,
            twilio_message_sid=msg_sid,
            direction=SMSDirection.OUTBOUND,
            from_number=business.twilio_phone_number,
            to_number=From,
            body=reply_text,
        )
        db.add(outbound_sms)

    # Re-qualify the lead with the latest conversation
    qualification = await qualify_lead(
        sms_conversation=conversation + f"\nCustomer: {Body}\nReceptionist: {reply_text}",
        business_services=business.services_offered,
    )

    # Update lead with latest qualification
    if qualification.get("caller_name") and not lead.caller_name:
        lead.caller_name = qualification["caller_name"]
    if qualification.get("service_type"):
        lead.service_type = qualification["service_type"]
    if qualification.get("urgency") and qualification["urgency"] != "unknown":
        lead.urgency = qualification["urgency"]
    if qualification.get("zip_code") and not lead.zip_code:
        lead.zip_code = qualification["zip_code"]
    if qualification.get("preferred_time"):
        lead.preferred_time = qualification["preferred_time"]
    lead.ai_summary = qualification.get("summary", lead.ai_summary)

    # Check if we have enough info to notify the owner
    message_count = len(messages)
    has_enough_info = (
        lead.service_type is not None
        or lead.urgency in ("emergency", "soon")
        or message_count >= 3  # After 3 exchanges, notify regardless
    )

    if has_enough_info and lead.status == LeadStatus.NEW:
        lead.status = LeadStatus.CONTACTED

        # Notify owner
        from app.models.models import User
        owner_result = await db.execute(
            select(User).where(User.id == business.owner_id)
        )
        owner = owner_result.scalar_one_or_none()

        if owner and owner.phone and business.twilio_phone_number:
            await notify_owner_sms(
                owner_phone=owner.phone,
                business_twilio_number=business.twilio_phone_number,
                lead_name=lead.caller_name,
                lead_phone=lead.caller_phone,
                service_type=lead.service_type,
                urgency=lead.urgency or "unknown",
                summary=lead.ai_summary or "New text lead",
            )

        if owner and owner.email:
            await notify_owner_email(
                owner_email=owner.email,
                owner_name=owner.full_name,
                business_name=business.name,
                lead_name=lead.caller_name,
                lead_phone=lead.caller_phone,
                service_type=lead.service_type,
                urgency=lead.urgency or "unknown",
                summary=lead.ai_summary or "New text lead",
            )

    logger.info(f"SMS from {From} to {business.name} processed")
    return {"status": "ok"}


# ── Recording Status Callback ────────────────────────────


@router.post("/recording-status", dependencies=[Depends(validate_twilio_request)])
async def handle_recording_status(request: Request):
    """
    Callback for recording status changes.
    We don't need to do much here — main processing is in /recording-complete.
    """
    return {"status": "ok"}
