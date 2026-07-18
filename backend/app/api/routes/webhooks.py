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

import hashlib
import logging
from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Form, Request, Response, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from twilio.request_validator import RequestValidator

from app.core.config import get_settings
from app.core.database import get_db
from app.models.models import (
    Business,
    User,
    Lead,
    LeadSource,
    LeadStatus,
    Urgency,
    CallLog,
    CallDirection,
    CallStatus as CallStatusEnum,
    Appointment,
    AppointmentStatus,
    SMSMessage,
    SMSDirection,
)
from app.services.twilio_service import (
    build_voice_webhook_url,
    generate_live_call_gather_twiml,
    generate_live_call_message_twiml,
    generate_live_call_transfer_twiml,
    generate_voicemail_twiml,
)
from app.services.ai_service import analyze_live_call
from app.services.business_rules import (
    check_customer_request,
    business_timezone,
    find_next_available_slot,
    format_business_hours,
    is_within_business_hours,
)
from app.services.automation_service import (
    enqueue_job,
    get_sms_consent,
    record_inbound_keyword,
    record_sms_consent,
)

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

    # The public request arrives through the Next.js same-origin proxy in the
    # single-service Railway deployment. Validate against the canonical public
    # callback URL instead of the private 127.0.0.1 URL FastAPI receives.
    url = f"{settings.BACKEND_URL.rstrip('/')}{request.url.path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"

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
        ).order_by(Lead.created_at.desc()).limit(1)
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


LIVE_CALL_MAX_TURNS = 5
LIVE_CALL_SLOT_NOTE_PREFIX = "[revorax-live-slot] "
LIVE_CALL_ALLOWED_INTENTS = {
    "book",
    "transfer",
    "callback",
    "sms",
    "faq",
    "service_request",
    "unknown",
}


def _twiml_response(twiml: str) -> Response:
    return Response(content=twiml, media_type="application/xml")


def _empty_sms_twiml_response() -> Response:
    """Acknowledge an inbound SMS without replying inline from the webhook."""
    return Response(content="<Response></Response>", media_type="application/xml")


def _safe_int(value: str, default: int = 0) -> int:
    try:
        return max(0, int(value))
    except (TypeError, ValueError):
        return default


async def _get_call_log(db: AsyncSession, call_sid: str) -> CallLog | None:
    result = await db.execute(
        select(CallLog).where(CallLog.twilio_call_sid == call_sid)
    )
    return result.scalar_one_or_none()


async def _get_or_create_inbound_call(
    db: AsyncSession,
    business: Business,
    call_sid: str,
    caller_phone: str,
    destination_phone: str,
) -> CallLog:
    """Make Twilio retries idempotent before the call reaches the AI flow."""
    existing = await _get_call_log(db, call_sid)
    if existing:
        return existing

    call_log = CallLog(
        business_id=business.id,
        twilio_call_sid=call_sid,
        direction=CallDirection.INBOUND,
        from_number=caller_phone,
        to_number=destination_phone,
        status=CallStatusEnum.MISSED,
    )
    try:
        # Twilio can deliver the same callback concurrently.  Keep the unique
        # call SID insert inside a savepoint so a collision does not poison the
        # surrounding webhook transaction (which may already contain lead
        # updates), then return the row written by the competing request.
        async with db.begin_nested():
            db.add(call_log)
            await db.flush()
        return call_log
    except IntegrityError:
        existing = await _get_call_log(db, call_sid)
        if existing:
            return existing
        raise


def _safe_urgency(value: object) -> Urgency:
    """Map untrusted AI output onto the only urgency values the schema accepts."""
    if isinstance(value, Urgency):
        return value
    if isinstance(value, str):
        try:
            return Urgency(value)
        except ValueError:
            pass
    return Urgency.UNKNOWN


def _urgency_value(lead: Lead) -> str:
    return _safe_urgency(lead.urgency).value


def _append_transcript(existing: str | None, speech: str) -> str:
    speech = " ".join(speech.split()).strip()
    if not speech:
        return existing or ""
    if not existing:
        return speech[:10_000]
    if speech in existing:
        return existing[:10_000]
    return f"{existing}\n{speech}"[-10_000:]


def _read_live_call_slot(notes: str | None) -> tuple[str | None, str | None]:
    if not notes:
        return None, None
    for line in reversed(notes.splitlines()):
        if line.startswith(LIVE_CALL_SLOT_NOTE_PREFIX):
            _, _, value = line.partition(LIVE_CALL_SLOT_NOTE_PREFIX)
            date_value, separator, time_value = value.partition(" ")
            return date_value or None, time_value if separator else None
    return None, None


def _write_live_call_slot(
    lead: Lead, requested_date: str | None, requested_time: str | None
) -> tuple[str | None, str | None]:
    existing_date, existing_time = _read_live_call_slot(lead.notes)
    requested_date = requested_date or existing_date
    requested_time = requested_time or existing_time
    if not requested_date and not requested_time:
        return None, None

    slot_line = f"{LIVE_CALL_SLOT_NOTE_PREFIX}{requested_date or ''} {requested_time or ''}".rstrip()
    note_lines = [
        line
        for line in (lead.notes or "").splitlines()
        if not line.startswith(LIVE_CALL_SLOT_NOTE_PREFIX)
    ]
    note_lines.append(slot_line)
    lead.notes = "\n".join(note_lines)[-4_000:]
    if requested_date and requested_time:
        lead.preferred_time = f"{requested_date} {requested_time}"
    return requested_date, requested_time


def _append_lead_note(lead: Lead, note: str) -> None:
    """Persist a short operational note without overwriting agent-entered notes."""
    if note in (lead.notes or ""):
        return
    lead.notes = f"{lead.notes or ''}\n{note}".strip()[-4_000:]


def _apply_live_call_analysis(
    lead: Lead,
    call_log: CallLog,
    speech: str,
    analysis: dict,
) -> tuple[str | None, str | None]:
    """Persist only bounded, validated analysis values from the live call."""
    if analysis.get("caller_name"):
        lead.caller_name = analysis["caller_name"]
    if analysis.get("service_type"):
        lead.service_type = analysis["service_type"]
    if analysis.get("zip_code"):
        lead.zip_code = analysis["zip_code"]
    if analysis.get("address"):
        lead.caller_address = analysis["address"]
    if analysis.get("preferred_time"):
        lead.preferred_time = analysis["preferred_time"]

    analyzed_urgency = _safe_urgency(analysis.get("urgency"))
    if (
        analyzed_urgency != Urgency.UNKNOWN
        or _urgency_value(lead) == Urgency.UNKNOWN.value
    ):
        lead.urgency = analyzed_urgency

    summary = analysis.get("summary")
    if isinstance(summary, str) and summary:
        lead.ai_summary = summary[:500]
        call_log.ai_summary = summary[:500]

    lead.transcript = _append_transcript(lead.transcript, speech)
    call_log.transcription = _append_transcript(call_log.transcription, speech)
    call_log.status = CallStatusEnum.ANSWERED
    call_log.lead_id = lead.id
    return _write_live_call_slot(
        lead,
        analysis.get("requested_date"),
        analysis.get("requested_time"),
    )


async def _get_transfer_target(
    db: AsyncSession, business: Business
) -> str | None:
    """Use a configured transfer line first and never dial the inbound number."""
    owner = await db.get(User, business.owner_id)
    candidates = (
        getattr(business, "call_transfer_number", None),
        owner.phone if owner else None,
        business.business_phone,
    )
    for candidate in candidates:
        if candidate and candidate != business.twilio_phone_number:
            return candidate
    return None


async def _queue_live_crm_sync(
    db: AsyncSession,
    business: Business,
    lead: Lead,
    call_log: CallLog,
) -> None:
    if not business.crm_webhook_url:
        return
    action = call_log.action_taken or "captured"
    await enqueue_job(
        db,
        business_id=business.id,
        lead_id=lead.id,
        kind="crm_sync",
        idempotency_key=f"voice-crm:{call_log.twilio_call_sid}:{action}",
        payload={
            "event_type": "call.live_action",
            "metadata": {
                "call_sid": call_log.twilio_call_sid,
                "action": action,
            },
        },
    )


async def _queue_live_owner_notification(
    db: AsyncSession,
    business: Business,
    lead: Lead,
    call_log: CallLog,
    *,
    callback_task: bool = False,
    run_at: datetime | None = None,
) -> None:
    """Queue the owner alert outside the Twilio response lifecycle."""
    action = call_log.action_taken or "captured"
    await _queue_live_crm_sync(db, business, lead, call_log)
    await enqueue_job(
        db,
        business_id=business.id,
        lead_id=lead.id,
        kind="callback_task" if callback_task else "owner_notification",
        idempotency_key=f"voice-owner:{call_log.twilio_call_sid}:{action}",
        run_at=run_at,
        payload={
            "summary": lead.ai_summary or "Live call captured by Revorax.",
            "call_sid": call_log.twilio_call_sid,
            "action": action,
        },
    )


def _callback_due_at(business: Business, lead: Lead) -> datetime:
    """Use an explicit collected slot for a callback; otherwise notify now."""
    requested_date, requested_time = _read_live_call_slot(lead.notes)
    if requested_date and requested_time:
        try:
            local_due = datetime.combine(
                date.fromisoformat(requested_date),
                time.fromisoformat(requested_time),
                tzinfo=business_timezone(business),
            )
            due_at = local_due.astimezone(timezone.utc)
            if due_at > datetime.now(timezone.utc):
                return due_at
        except ValueError:
            pass
    return datetime.now(timezone.utc)


async def _queue_voice_appointment_reminders(
    db: AsyncSession,
    business: Business,
    lead: Lead,
    appointment: Appointment,
) -> None:
    """Schedule consent-gated reminders for an appointment booked by voice."""
    if not appointment.scheduled_date or not appointment.scheduled_time:
        return
    try:
        local_start = datetime.combine(
            date.fromisoformat(appointment.scheduled_date),
            time.fromisoformat(appointment.scheduled_time),
            tzinfo=business_timezone(business),
        )
    except ValueError:
        return
    now = datetime.now(timezone.utc)
    for label, offset in (("24h", timedelta(hours=24)), ("1h", timedelta(hours=1))):
        run_at = local_start.astimezone(timezone.utc) - offset
        if run_at <= now:
            continue
        await enqueue_job(
            db,
            business_id=business.id,
            lead_id=lead.id,
            kind="appointment_reminder",
            idempotency_key=f"appointment-reminder:{appointment.id}:{label}",
            run_at=run_at,
            payload={"appointment_id": str(appointment.id), "reminder": label},
        )


def _faq_answer(business: Business, topic: str, speech: str) -> str:
    """Answer only from the business profile; never let the model invent facts."""
    if topic == "hours":
        return format_business_hours(business)
    if topic == "services":
        services = [
            service.strip()
            for service in (business.services_offered or [])
            if isinstance(service, str) and service.strip()
        ]
        if services:
            return f"We currently offer {', '.join(services[:6])}."
        return "Our team will confirm the right service for your request."
    if topic == "location":
        location = ", ".join(
            value
            for value in (business.address, business.city, business.state, business.zip_code)
            if value
        )
        if location:
            return f"Our business location is {location}."
        return "Our team will confirm the best service location when they call you back."

    speech_words = {word for word in speech.lower().split() if len(word) > 3}
    for item in business.faqs or []:
        if not isinstance(item, dict):
            continue
        question = item.get("question")
        answer = item.get("answer")
        if not isinstance(question, str) or not isinstance(answer, str):
            continue
        question_words = {word for word in question.lower().split() if len(word) > 3}
        if speech_words.intersection(question_words):
            return " ".join(answer.split())[:500]
    return "I can help with service requests, hours, and location. For anything else, our team will be happy to call you back."


def _next_missing_field(lead: Lead, intent: str) -> str | None:
    """Ask for one fact at a time; the caller phone is supplied by Twilio."""
    fields = ["caller_name", "address", "service_type", "urgency"]
    if intent == "book":
        fields.extend(["requested_date", "requested_time"])

    for field in fields:
        if field == "caller_name" and not lead.caller_name:
            return field
        if field == "address" and not lead.caller_address:
            return field
        if field == "service_type" and not lead.service_type:
            return field
        if field == "urgency" and _urgency_value(lead) == Urgency.UNKNOWN.value:
            return field
        if field in {"requested_date", "requested_time"}:
            requested_date, requested_time = _read_live_call_slot(lead.notes)
            if field == "requested_date" and not requested_date:
                return field
            if field == "requested_time" and not requested_time:
                return field
    return None


def _qualification_prompt(field: str) -> str:
    prompts = {
        "caller_name": "Before I continue, may I have your full name?",
        "address": "What is the service address, including the ZIP code?",
        "service_type": "What service do you need help with?",
        "urgency": "Is this an emergency, needed soon, or a flexible request?",
        "requested_date": "What date would you prefer? Please say the month, day, and year.",
        "requested_time": "What time would you prefer? Please include A M or P M.",
    }
    return prompts[field]


def _safe_turn(request: Request) -> int:
    try:
        return max(0, min(int(request.query_params.get("turn", "0")), LIVE_CALL_MAX_TURNS))
    except ValueError:
        return 0


def _safe_intent(value: str | None) -> str | None:
    return value if value in LIVE_CALL_ALLOWED_INTENTS else None


async def _send_requested_live_call_sms(
    db: AsyncSession,
    business: Business,
    lead: Lead,
    call_log: CallLog,
) -> bool:
    """Queue a requested text only when consent allows the conversational reply."""
    if call_log.action_taken == "sms" or not business.twilio_phone_number:
        return call_log.action_taken == "sms"

    existing_consent = await get_sms_consent(db, business.id, lead.caller_phone)
    if existing_consent and existing_consent.status == "opted_out":
        return False

    consent = await record_sms_consent(
        db,
        business_id=business.id,
        phone_number=lead.caller_phone,
        consent_status=(
            "opted_in"
            if existing_consent and existing_consent.status == "opted_in"
            else "conversational"
        ),
        source="voice_sms_request",
        evidence="Caller explicitly requested an SMS during a live call.",
    )
    lead.consent_status = consent.status
    lead.consent_updated_at = datetime.now(timezone.utc)

    body = (
        f"Thanks for calling {business.name}. We received your request and "
        "a team member will follow up shortly. Reply STOP to opt out."
    )
    await enqueue_job(
        db,
        business_id=business.id,
        lead_id=lead.id,
        kind="follow_up_sms",
        idempotency_key=f"voice-follow-up-sms:{call_log.twilio_call_sid}",
        payload={"body": body, "purpose": "manual"},
    )
    _append_lead_note(lead, "Caller explicitly requested an SMS during the live call.")
    call_log.action_taken = "sms"
    if lead.status != LeadStatus.BOOKED:
        lead.status = LeadStatus.CONTACTED
    await _queue_live_owner_notification(db, business, lead, call_log)
    return True


async def _route_to_callback(
    db: AsyncSession,
    business: Business,
    lead: Lead,
    call_log: CallLog,
    message: str,
) -> Response:
    """Capture a callback without re-alerting the owner on a Twilio retry."""
    if lead.status != LeadStatus.BOOKED:
        lead.status = LeadStatus.CONTACTED
    due_at = _callback_due_at(business, lead)
    lead.next_follow_up_at = due_at
    if call_log.action_taken != "callback":
        call_log.action_taken = "callback"
        await _queue_live_owner_notification(
            db, business, lead, call_log, callback_task=True, run_at=due_at
        )
    return _twiml_response(generate_live_call_message_twiml(message))


async def _book_available_live_call_slot(
    db: AsyncSession,
    business: Business,
    lead: Lead,
    call_log: CallLog,
    requested_date: str | None,
    requested_time: str | None,
) -> tuple[Appointment | None, str | None]:
    """Book only a configured, open slot; otherwise return a safe reason."""
    existing_result = await db.execute(
        select(Appointment).where(
            Appointment.business_id == business.id,
            Appointment.lead_id == lead.id,
            Appointment.status != AppointmentStatus.CANCELLED,
        )
    )
    existing = existing_result.scalars().first()
    if existing:
        return existing, None

    rules = check_customer_request(
        business,
        zip_code=lead.zip_code,
        service_type=lead.service_type,
    )
    if not rules.can_auto_book:
        return None, rules.reason or "The appointment needs a team confirmation."

    appointments_result = await db.execute(
        select(Appointment).where(Appointment.business_id == business.id)
    )
    slot = find_next_available_slot(
        business,
        appointments_result.scalars().all(),
        requested_date=requested_date,
        requested_time=requested_time,
    )
    if not slot:
        return None, "That requested time is not currently available."

    appointment = Appointment(
        business_id=business.id,
        lead_id=lead.id,
        scheduled_date=slot[0],
        scheduled_time=slot[1],
        service_type=lead.service_type,
        notes=(lead.ai_summary or "Booked from live AI call.")[:1_000],
        booking_source="voice_ai",
        customer_confirmed_at=datetime.now(timezone.utc),
        status=AppointmentStatus.CONFIRMED,
    )
    try:
        async with db.begin_nested():
            db.add(appointment)
            await db.flush()
    except IntegrityError:
        return None, "That time was just booked by another customer."
    lead.status = LeadStatus.BOOKED
    call_log.action_taken = "booked"
    await _queue_voice_appointment_reminders(db, business, lead, appointment)
    await _queue_live_owner_notification(db, business, lead, call_log)
    return appointment, None


# ── Voice Webhook ────────────────────────────────────────


@router.post("/voice", dependencies=[Depends(validate_twilio_request)])
async def handle_inbound_call(
    CallSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a bounded live-call flow.  The caller can speak naturally or press
    zero for a person; voicemail remains the no-input fallback.
    """
    business = await _get_business_by_number(db, To)
    if not business:
        logger.warning(f"Call to unregistered number: {To}")
        return _twiml_response(
            generate_live_call_message_twiml(
                "Sorry, this number is not currently in service."
            )
        )

    await _get_or_create_inbound_call(
        db,
        business,
        call_sid=CallSid,
        caller_phone=From,
        destination_phone=To,
    )

    twiml = generate_live_call_gather_twiml(
        (
            f"Thank you for calling {business.name}. I am the automated assistant. "
            "Please tell me your name, your service address including ZIP code, "
            "and how I can help. You can also press zero to speak with the team."
        ),
        build_voice_webhook_url("voice/intent", {"turn": 0}),
    )
    return _twiml_response(twiml)


@router.post("/voice/intent", dependencies=[Depends(validate_twilio_request)])
async def handle_live_call_intent(
    request: Request,
    CallSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    SpeechResult: str = Form(""),
    Digits: str = Form(""),
    db: AsyncSession = Depends(get_db),
):
    """Capture speech, apply deterministic rules, and choose one safe action."""
    business = await _get_business_by_number(db, To)
    if not business:
        return _twiml_response(
            generate_live_call_message_twiml(
                "Sorry, this number is not currently in service."
            )
        )

    call_log = await _get_or_create_inbound_call(
        db,
        business,
        call_sid=CallSid,
        caller_phone=From,
        destination_phone=To,
    )
    turn = _safe_turn(request)
    speech = " ".join(SpeechResult.split()).strip()

    # Pressing zero is intentionally handled locally so a caller can always
    # ask for a human even if the AI provider is unavailable.
    requested_human = Digits == "0"
    if requested_human:
        speech = speech or "Please transfer me to a person."

    if not speech:
        if turn < 1:
            retry_url = build_voice_webhook_url("voice/intent", {"turn": turn + 1})
            return _twiml_response(
                generate_live_call_gather_twiml(
                    "I did not catch that. Please tell me how we can help, or press zero to speak with the team.",
                    retry_url,
                )
            )
        return _twiml_response(
            generate_voicemail_twiml(
                greeting=(
                    f"Thanks for calling {business.name}. We were unable to hear you. "
                    "Please leave your name, service address, phone number, and a brief message."
                )
            )
        )

    lead = await _get_or_create_lead(
        db, business.id, From, LeadSource.MISSED_CALL
    )
    expected_field = request.query_params.get("field")
    analysis = await analyze_live_call(
        speech,
        business_services=business.services_offered,
        expected_field=expected_field,
    )
    if requested_human:
        analysis["intent"] = "transfer"
        analysis["summary"] = "Caller requested a human transfer."

    persisted_intent = _safe_intent(request.query_params.get("intent"))
    analyzed_intent = _safe_intent(analysis.get("intent")) or "service_request"
    if persisted_intent and analyzed_intent in {"unknown", "service_request"}:
        intent = persisted_intent
    else:
        intent = analyzed_intent

    requested_date, requested_time = _apply_live_call_analysis(
        lead, call_log, speech, analysis
    )
    urgency = _urgency_value(lead)

    # Emergencies and explicit transfer requests are never held up by
    # qualification questions.  After-hours or unconfigured transfers become
    # owner-notified callbacks instead of a false promise.
    if urgency == Urgency.EMERGENCY.value or intent == "transfer":
        transfer_target = await _get_transfer_target(db, business)
        if is_within_business_hours(business) is True and transfer_target:
            call_log.action_taken = "transfer"
            return _twiml_response(
                generate_live_call_transfer_twiml(
                    transfer_target,
                    build_voice_webhook_url("voice/transfer-status"),
                    caller_id=business.twilio_phone_number,
                )
            )
        return await _route_to_callback(
            db,
            business,
            lead,
            call_log,
            (
                "Our team is not available for a live transfer right now. "
                "I have sent them your request, and they will call you back as soon as possible."
            ),
        )

    if intent == "faq":
        call_log.action_taken = "faq"
        await _queue_live_crm_sync(db, business, lead, call_log)
        return _twiml_response(
            generate_live_call_message_twiml(
                _faq_answer(business, analysis.get("faq_topic", "general"), speech)
            )
        )

    if intent == "sms":
        sms_sent = await _send_requested_live_call_sms(db, business, lead, call_log)
        if sms_sent:
            message = (
                "A text confirmation is on its way to this number. "
                "A team member will follow up shortly."
            )
        else:
            message = (
                "I could not send a text confirmation right now, but I have "
                "sent your request to the team for a callback."
            )
            return await _route_to_callback(db, business, lead, call_log, message)
        return _twiml_response(generate_live_call_message_twiml(message))

    missing_field = _next_missing_field(lead, intent)
    if missing_field and turn < LIVE_CALL_MAX_TURNS:
        next_url = build_voice_webhook_url(
            "voice/intent",
            {
                "turn": turn + 1,
                "intent": intent,
                "field": missing_field,
            },
        )
        return _twiml_response(
            generate_live_call_gather_twiml(
                _qualification_prompt(missing_field),
                next_url,
            )
        )

    if intent == "book":
        if missing_field:
            return await _route_to_callback(
                db,
                business,
                lead,
                call_log,
                (
                    "I need a little more information before an appointment can be confirmed. "
                    "I have sent the request to the team, and they will call you back."
                ),
            )
        appointment, reason = await _book_available_live_call_slot(
            db,
            business,
            lead,
            call_log,
            requested_date,
            requested_time,
        )
        if appointment:
            return _twiml_response(
                generate_live_call_message_twiml(
                    (
                        "Your appointment is confirmed for "
                        f"{appointment.scheduled_date} at {appointment.scheduled_time}. "
                        "A team member will follow up with any final details."
                    )
                )
            )
        return await _route_to_callback(
            db,
            business,
            lead,
            call_log,
            (
                f"{reason or 'Your appointment needs confirmation.'} "
                "I have sent the request to the team, and they will call you back."
            ),
        )

    return await _route_to_callback(
        db,
        business,
        lead,
        call_log,
        "Thank you. I have sent your request to the team, and they will call you back shortly.",
    )


@router.post("/voice/transfer-status", dependencies=[Depends(validate_twilio_request)])
async def handle_live_call_transfer_status(
    CallSid: str = Form(...),
    From: str = Form(""),
    To: str = Form(""),
    DialCallStatus: str = Form(""),
    db: AsyncSession = Depends(get_db),
):
    """Finish a human-transfer attempt and recover to a callback on failure."""
    call_log = await _get_call_log(db, CallSid)
    if not call_log:
        return _twiml_response(
            generate_live_call_message_twiml("Thank you for calling. Goodbye.")
        )

    business = await db.get(Business, call_log.business_id)
    if not business:
        return _twiml_response(
            generate_live_call_message_twiml("Thank you for calling. Goodbye.")
        )

    if DialCallStatus in {"completed", "answered"}:
        call_log.status = CallStatusEnum.ANSWERED
        call_log.action_taken = "transfer"
        lead = await db.get(Lead, call_log.lead_id) if call_log.lead_id else None
        if lead:
            await _queue_live_crm_sync(db, business, lead, call_log)
        return _twiml_response(
            generate_live_call_message_twiml("Thank you for calling. Goodbye.")
        )

    lead = await db.get(Lead, call_log.lead_id) if call_log.lead_id else None
    if not lead:
        caller_phone = From or call_log.from_number
        lead = await _get_or_create_lead(
            db, business.id, caller_phone, LeadSource.MISSED_CALL
        )
        call_log.lead_id = lead.id
    return await _route_to_callback(
        db,
        business,
        lead,
        call_log,
        (
            "We could not complete the live transfer, but I have sent your "
            "request to the team and they will call you back shortly."
        ),
    )


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
        return _twiml_response(
            generate_live_call_message_twiml("Thank you for calling. Goodbye.")
        )

    lead = await _get_or_create_lead(db, business.id, From, LeadSource.VOICEMAIL)
    call = await _get_or_create_inbound_call(
        db,
        business,
        call_sid=CallSid,
        caller_phone=From,
        destination_phone=To,
    )
    call.recording_url = f"{RecordingUrl}.wav"
    call.recording_sid = RecordingSid
    call.duration_seconds = _safe_int(RecordingDuration)
    call.status = CallStatusEnum.VOICEMAIL
    call.lead_id = lead.id

    await enqueue_job(
        db,
        business_id=business.id,
        lead_id=lead.id,
        kind="voicemail_process",
        idempotency_key=f"voicemail-process:{RecordingSid}",
        payload={
            "recording_url": f"{RecordingUrl}.wav",
            "recording_sid": RecordingSid,
            "call_sid": CallSid,
        },
    )
    return _twiml_response(
        generate_live_call_message_twiml(
            "Thank you. We have your message and our team will follow up shortly."
        )
    )


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
    """Persist status facts and enqueue a consent-gated missed-call recovery."""
    business = await _get_business_by_number(db, To)
    if not business:
        return {"status": "ignored"}

    call = await _get_or_create_inbound_call(
        db,
        business,
        call_sid=CallSid,
        caller_phone=From,
        destination_phone=To,
    )
    call.status = map_twilio_call_status(CallStatus)
    call.duration_seconds = _safe_int(CallDuration)

    if CallStatus in ("no-answer", "busy", "canceled", "failed"):
        lead = await _get_or_create_lead(db, business.id, From, LeadSource.MISSED_CALL)
        call.lead_id = lead.id
        existing_consent = await get_sms_consent(db, business.id, From)
        if not existing_consent or existing_consent.status != "opted_out":
            consent = await record_sms_consent(
                db,
                business_id=business.id,
                phone_number=From,
                consent_status=(
                    "opted_in"
                    if existing_consent and existing_consent.status == "opted_in"
                    else "conversational"
                ),
                source="inbound_call",
                evidence=f"Inbound call {CallSid} ended with {CallStatus}.",
            )
            lead.consent_status = consent.status
            lead.consent_updated_at = datetime.now(timezone.utc)
            await enqueue_job(
                db,
                business_id=business.id,
                lead_id=lead.id,
                kind="follow_up_sms",
                idempotency_key=f"missed-call-follow-up:{CallSid}",
                payload={
                    "body": (
                        f"Hi! This is {business.name}. We noticed we missed your call. "
                        "How can we help? Reply STOP to opt out."
                    )
                },
                max_attempts=1,
            )
        await enqueue_job(
            db,
            business_id=business.id,
            lead_id=lead.id,
            kind="owner_notification",
            idempotency_key=f"missed-call-owner-notification:{CallSid}",
            payload={"summary": f"Missed call ({CallStatus}) from {From}."},
        )

    return {"status": "queued"}


# ── SMS Webhook ──────────────────────────────────────────


@router.post("/sms", dependencies=[Depends(validate_twilio_request)])
async def handle_inbound_sms(
    From: str = Form(...),
    To: str = Form(...),
    Body: str = Form(...),
    MessageSid: str = Form(""),
    db: AsyncSession = Depends(get_db),
):
    """Persist one inbound message, honor consent keywords, then enqueue work."""
    business = await _get_business_by_number(db, To)
    if not business:
        logger.warning(f"SMS to unregistered number: {To}")
        return _empty_sms_twiml_response()

    supplied_sid = MessageSid.strip()
    message_key = (
        supplied_sid
        if supplied_sid and len(supplied_sid) <= 50
        else hashlib.sha256(f"{business.id}:{From}:{To}:{Body}".encode()).hexdigest()[:50]
    )
    existing_result = await db.execute(
        select(SMSMessage).where(SMSMessage.twilio_message_sid == message_key)
    )
    if existing_result.scalar_one_or_none():
        return _empty_sms_twiml_response()

    lead = await _get_or_create_lead(db, business.id, From, LeadSource.SMS)

    inbound_sms = SMSMessage(
        business_id=business.id,
        lead_id=lead.id,
        twilio_message_sid=message_key,
        direction=SMSDirection.INBOUND,
        from_number=From,
        to_number=To,
        body=Body,
    )
    try:
        # Twilio can retry the same inbound message before the first request
        # has committed.  The unique message SID is the final idempotency
        # guard; use a savepoint so the losing request returns TwiML instead
        # of a 500 and never queues a second AI response.
        async with db.begin_nested():
            db.add(inbound_sms)
            await db.flush()
    except IntegrityError:
        duplicate = await db.execute(
            select(SMSMessage.id).where(SMSMessage.twilio_message_sid == message_key)
        )
        if duplicate.scalar_one_or_none():
            return _empty_sms_twiml_response()
        raise

    action, consent = await record_inbound_keyword(
        db,
        business_id=business.id,
        phone_number=From,
        body=Body,
    )
    lead.consent_status = consent.status
    lead.consent_updated_at = datetime.now(timezone.utc)
    if action == "stop" or consent.status == "opted_out":
        logger.info("Recorded SMS opt-out for business %s", business.id)
        return _empty_sms_twiml_response()

    await enqueue_job(
        db,
        business_id=business.id,
        lead_id=lead.id,
        kind="sms_process",
        idempotency_key=f"sms-process:{message_key}",
        payload={
            "message_sid": message_key,
            "reply_mode": "help" if action == "help" else "conversation",
        },
    )
    return _empty_sms_twiml_response()


# ── Recording Status Callback ────────────────────────────


@router.post("/recording-status", dependencies=[Depends(validate_twilio_request)])
async def handle_recording_status(request: Request):
    """
    Callback for recording status changes.
    We don't need to do much here — main processing is in /recording-complete.
    """
    return {"status": "ok"}
