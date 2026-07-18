"""Database-backed automation worker for the single Railway deployment.

It deliberately uses the existing Postgres database instead of requiring a
second deployable process or an always-on Redis queue.  The root launch script
starts it alongside FastAPI and Next.js; jobs survive restarts and every action
is keyed by a durable idempotency key.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import and_, select

from app.core.config import get_settings
from app.core.database import async_session
from app.models.models import (
    Appointment,
    AppointmentStatus,
    AutomationJob,
    Business,
    CallLog,
    Lead,
    LeadStatus,
    SMSDirection,
    SMSMessage,
    Urgency,
    User,
)
from app.services.automation_service import (
    build_crm_event,
    can_send_automated_sms,
    deliver_crm_event,
    enqueue_job,
    get_sms_consent,
)
from app.services.notification_service import notify_owner_email, notify_owner_sms
from app.services.ai_service import generate_sms_reply, qualify_lead, transcribe_audio
from app.services.twilio_service import send_sms


logger = logging.getLogger(__name__)
settings = get_settings()

CUSTOMER_SMS_KINDS = {"follow_up_sms", "review_request", "appointment_reminder"}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _safe_urgency(value: object) -> Urgency:
    if isinstance(value, Urgency):
        return value
    if isinstance(value, str):
        try:
            return Urgency(value)
        except ValueError:
            pass
    return Urgency.UNKNOWN


def _bounded_text(value: object, limit: int) -> str | None:
    if not isinstance(value, str):
        return None
    compact = " ".join(value.split()).strip()
    return compact[:limit] if compact else None


async def _enqueue_owner_notification(
    db,
    *,
    business: Business,
    lead: Lead,
    idempotency_key: str,
    summary: str | None = None,
) -> None:
    await enqueue_job(
        db,
        business_id=business.id,
        lead_id=lead.id,
        kind="owner_notification",
        idempotency_key=idempotency_key,
        payload={"summary": summary or lead.ai_summary or "Customer follow-up required"},
    )


async def _enqueue_crm_sync(
    db,
    *,
    business: Business,
    lead: Lead,
    event_type: str,
    idempotency_key: str,
    metadata: dict | None = None,
) -> None:
    if not business.crm_webhook_url:
        return
    await enqueue_job(
        db,
        business_id=business.id,
        lead_id=lead.id,
        kind="crm_sync",
        idempotency_key=idempotency_key,
        payload={"event_type": event_type, "metadata": metadata or {}},
    )


async def _qualify_sms_lead(
    db,
    *,
    business: Business,
    lead: Lead,
    conversation: str,
    source_key: str,
) -> None:
    """Apply only bounded, enum-safe LLM fields to a tenant lead."""
    qualification = await qualify_lead(
        sms_conversation=conversation,
        business_services=business.services_offered,
    )
    caller_name = _bounded_text(qualification.get("caller_name"), 255)
    service_type = _bounded_text(qualification.get("service_type"), 255)
    zip_code = _bounded_text(qualification.get("zip_code"), 10)
    address = _bounded_text(qualification.get("address"), 500)
    preferred_time = _bounded_text(qualification.get("preferred_time"), 255)
    summary = _bounded_text(qualification.get("summary"), 500)
    if caller_name and not lead.caller_name:
        lead.caller_name = caller_name
    if service_type:
        lead.service_type = service_type
    urgency = _safe_urgency(qualification.get("urgency"))
    if urgency != Urgency.UNKNOWN:
        lead.urgency = urgency
    if zip_code and not lead.zip_code:
        lead.zip_code = zip_code
    if address and not lead.caller_address:
        lead.caller_address = address
    if preferred_time:
        lead.preferred_time = preferred_time
    if summary:
        lead.ai_summary = summary

    has_enough_info = (
        lead.service_type is not None
        or _safe_urgency(lead.urgency) in {Urgency.EMERGENCY, Urgency.SOON}
        or conversation.count("Customer:") >= 3
    )
    if has_enough_info and lead.status == LeadStatus.NEW:
        lead.status = LeadStatus.CONTACTED
        await _enqueue_owner_notification(
            db,
            business=business,
            lead=lead,
            idempotency_key=f"sms-owner-notification:{source_key}",
            summary=lead.ai_summary or "New text lead",
        )
    await _enqueue_crm_sync(
        db,
        business=business,
        lead=lead,
        event_type="lead.sms_qualified",
        idempotency_key=f"sms-crm-sync:{source_key}",
        metadata={"source_message": source_key},
    )


async def _recover_stale_jobs() -> None:
    """Recover retryable work; never blindly resend an uncertain customer SMS."""
    stale_before = utcnow() - timedelta(minutes=settings.AUTOMATION_STALE_MINUTES)
    async with async_session() as db:
        result = await db.execute(
            select(AutomationJob)
            .where(
                AutomationJob.status.in_(["processing", "sending"]),
                AutomationJob.locked_at < stale_before,
            )
            .with_for_update(skip_locked=True)
        )
        for job in result.scalars():
            if job.status == "sending" or job.kind in CUSTOMER_SMS_KINDS:
                # A previous worker may have reached Twilio then died before it
                # persisted the SID.  At-most-once delivery is safer than a
                # duplicate marketing/review text; surface it for an owner.
                job.status = "manual_review"
                job.last_error = "Delivery outcome is unknown after worker interruption; do not resend automatically."
            elif job.attempts >= job.max_attempts:
                job.status = "failed"
                job.last_error = "Job exceeded retry limit after worker interruption."
            else:
                job.status = "queued"
                job.locked_at = None
        await db.commit()


async def _claim_due_job_ids() -> list[UUID]:
    async with async_session() as db:
        result = await db.execute(
            select(AutomationJob)
            .where(
                AutomationJob.status == "queued",
                AutomationJob.run_at <= utcnow(),
            )
            .order_by(AutomationJob.run_at.asc(), AutomationJob.created_at.asc())
            .with_for_update(skip_locked=True)
            .limit(settings.AUTOMATION_WORKER_BATCH_SIZE)
        )
        jobs = result.scalars().all()
        now = utcnow()
        for job in jobs:
            job.status = "processing"
            job.locked_at = now
            job.attempts += 1
        await db.commit()
        return [job.id for job in jobs]


async def _load_context(db, job: AutomationJob) -> tuple[Business, Lead | None, User]:
    business_result = await db.execute(select(Business).where(Business.id == job.business_id))
    business = business_result.scalar_one_or_none()
    if not business:
        raise ValueError("Business no longer exists")
    owner_result = await db.execute(select(User).where(User.id == business.owner_id))
    owner = owner_result.scalar_one_or_none()
    if not owner:
        raise ValueError("Business owner no longer exists")
    lead = None
    if job.lead_id:
        lead_result = await db.execute(
            select(Lead).where(Lead.id == job.lead_id, Lead.business_id == business.id)
        )
        lead = lead_result.scalar_one_or_none()
        if not lead:
            raise ValueError("Lead no longer exists")
    return business, lead, owner


async def _send_customer_sms_once(
    db,
    job: AutomationJob,
    business: Business,
    lead: Lead,
    body: str,
    *,
    purpose: str,
) -> str:
    consent = await get_sms_consent(db, business.id, lead.caller_phone)
    if not can_send_automated_sms(consent, purpose=purpose):
        return "skipped: consent does not permit this automated message"
    if not business.twilio_phone_number:
        raise ValueError("Business has no active Twilio number")

    # Persist a sent-intent before the external call.  A crash in this narrow
    # window is converted to manual review rather than a duplicate text.
    job.status = "sending"
    job.locked_at = utcnow()
    await db.commit()

    message_sid = await send_sms(
        to=lead.caller_phone,
        from_=business.twilio_phone_number,
        body=body,
    )
    if not message_sid:
        raise RuntimeError("Twilio did not return an outbound message SID")

    db.add(
        SMSMessage(
            business_id=business.id,
            lead_id=lead.id,
            twilio_message_sid=message_sid,
            direction=SMSDirection.OUTBOUND,
            from_number=business.twilio_phone_number,
            to_number=lead.caller_phone,
            body=body,
        )
    )
    lead.last_contacted_at = utcnow()
    return message_sid


async def _run_job(db, job: AutomationJob) -> str:
    business, lead, owner = await _load_context(db, job)
    payload = job.payload if isinstance(job.payload, dict) else {}

    if job.kind == "voicemail_process":
        if not lead:
            raise ValueError("Voicemail processing requires a lead")
        recording_url = _bounded_text(payload.get("recording_url"), 1000)
        call_sid = _bounded_text(payload.get("call_sid"), 50)
        recording_sid = _bounded_text(payload.get("recording_sid"), 50) or str(job.id)
        call = None
        if call_sid:
            call_result = await db.execute(
                select(CallLog).where(
                    CallLog.business_id == business.id,
                    CallLog.twilio_call_sid == call_sid,
                )
            )
            call = call_result.scalar_one_or_none()

        transcript = await transcribe_audio(recording_url) if recording_url else None
        if transcript:
            lead.transcript = transcript[:10000]
            qualification = await qualify_lead(
                transcript=transcript,
                business_services=business.services_offered,
            )
            caller_name = _bounded_text(qualification.get("caller_name"), 255)
            service_type = _bounded_text(qualification.get("service_type"), 255)
            zip_code = _bounded_text(qualification.get("zip_code"), 10)
            address = _bounded_text(qualification.get("address"), 500)
            preferred_time = _bounded_text(qualification.get("preferred_time"), 255)
            summary = _bounded_text(qualification.get("summary"), 500)
            if caller_name:
                lead.caller_name = caller_name
            if service_type:
                lead.service_type = service_type
            lead.urgency = _safe_urgency(qualification.get("urgency"))
            if zip_code:
                lead.zip_code = zip_code
            if address:
                lead.caller_address = address
            if preferred_time:
                lead.preferred_time = preferred_time
            if summary:
                lead.ai_summary = summary
            if call:
                call.transcription = transcript[:10000]
                call.ai_summary = lead.ai_summary
        else:
            lead.ai_summary = lead.ai_summary or "New voicemail received; transcription is pending manual review."

        lead.status = LeadStatus.CONTACTED
        if call:
            call.action_taken = "voicemail"
        await _enqueue_owner_notification(
            db,
            business=business,
            lead=lead,
            idempotency_key=f"voicemail-owner-notification:{recording_sid}",
            summary=lead.ai_summary or "New voicemail received",
        )
        await _enqueue_crm_sync(
            db,
            business=business,
            lead=lead,
            event_type="lead.voicemail_processed",
            idempotency_key=f"voicemail-crm-sync:{recording_sid}",
            metadata={"recording_sid": recording_sid, "transcribed": bool(transcript)},
        )
        return "Voicemail processed" if transcript else "Voicemail saved for manual review"

    if job.kind == "sms_process":
        if not lead:
            raise ValueError("SMS processing requires a lead")
        source_key = _bounded_text(payload.get("message_sid"), 100) or str(job.id)
        consent = await get_sms_consent(db, business.id, lead.caller_phone)
        messages_result = await db.execute(
            select(SMSMessage)
            .where(
                SMSMessage.business_id == business.id,
                SMSMessage.lead_id == lead.id,
            )
            .order_by(SMSMessage.created_at.asc())
        )
        messages = messages_result.scalars().all()
        conversation = "\n".join(
            f"{'Customer' if message.direction == SMSDirection.INBOUND else 'Receptionist'}: {message.body}"
            for message in messages
        )
        reply_text: str | None = None
        if business.twilio_phone_number and can_send_automated_sms(
            consent, purpose="conversation"
        ):
            if payload.get("reply_mode") == "help":
                reply_text = (
                    f"{business.name}: reply with what you need help with and your ZIP code. "
                    "Reply STOP to opt out."
                )
            else:
                generated_reply = await generate_sms_reply(
                    conversation_history=conversation,
                    business_name=business.name,
                    business_services=business.services_offered,
                )
                reply_text = _bounded_text(generated_reply, 1600) or (
                    f"Thanks for contacting {business.name}. A team member will follow up shortly."
                )
            await _send_customer_sms_once(
                db, job, business, lead, reply_text, purpose="conversation"
            )

        qualification_conversation = conversation
        if reply_text:
            qualification_conversation = f"{conversation}\nReceptionist: {reply_text}"
        await _qualify_sms_lead(
            db,
            business=business,
            lead=lead,
            conversation=qualification_conversation,
            source_key=source_key,
        )
        return "SMS conversation processed"

    if job.kind == "crm_sync":
        metadata = payload.get("metadata")
        if not isinstance(metadata, dict):
            metadata = {}
        event = build_crm_event(
            event_type=str(payload.get("event_type") or "lead.updated"),
            business=business,
            lead=lead,
            metadata={**metadata, "delivery_id": str(job.id)},
        )
        delivered = await deliver_crm_event(business, event)
        if lead and delivered:
            lead.crm_synced_at = utcnow()
        return "CRM event delivered" if delivered else "CRM sync skipped: no connector configured"

    if job.kind in {"owner_notification", "callback_task"}:
        if not lead:
            raise ValueError("Owner notification requires a lead")
        summary = str(payload.get("summary") or lead.ai_summary or "Customer follow-up required")
        attempted = False
        delivered = False
        if owner.phone and business.twilio_phone_number:
            attempted = True
            delivered = await notify_owner_sms(
                owner_phone=owner.phone,
                business_twilio_number=business.twilio_phone_number,
                lead_name=lead.caller_name,
                lead_phone=lead.caller_phone,
                service_type=lead.service_type,
                urgency=str(getattr(lead.urgency, "value", lead.urgency) or "unknown"),
                summary=summary,
            )
        if owner.email:
            attempted = True
            delivered = (
                await notify_owner_email(
                    owner_email=owner.email,
                    owner_name=owner.full_name,
                    business_name=business.name,
                    lead_name=lead.caller_name,
                    lead_phone=lead.caller_phone,
                    service_type=lead.service_type,
                    urgency=str(getattr(lead.urgency, "value", lead.urgency) or "unknown"),
                    summary=summary,
                    transcript=lead.transcript,
                )
                or delivered
            )
        if not attempted:
            raise ValueError("Business owner has no configured notification channel")
        if not delivered:
            raise RuntimeError("No owner notification channel accepted the delivery")
        return "Owner notified" if job.kind == "owner_notification" else "Callback task sent to owner"

    if job.kind == "follow_up_sms":
        if not lead:
            raise ValueError("Follow-up requires a lead")
        body = str(payload.get("body") or "Thanks for contacting us. Would you like help scheduling service?")
        purpose = "manual" if payload.get("purpose") == "manual" else "conversation"
        return await _send_customer_sms_once(db, job, business, lead, body, purpose=purpose)

    if job.kind == "review_request":
        if not lead:
            raise ValueError("Review request requires a lead")
        body = str(
            payload.get("body")
            or f"Thanks for choosing {business.name}. If we earned it, would you share a quick review? Reply STOP to opt out."
        )
        return await _send_customer_sms_once(db, job, business, lead, body, purpose="review")

    if job.kind == "appointment_reminder":
        if not lead:
            raise ValueError("Appointment reminder requires a lead")
        raw_id = payload.get("appointment_id")
        if not raw_id:
            raise ValueError("Appointment reminder is missing an appointment id")
        appt_result = await db.execute(
            select(Appointment).where(
                Appointment.id == UUID(str(raw_id)), Appointment.business_id == business.id
            )
        )
        appointment = appt_result.scalar_one_or_none()
        if not appointment or appointment.status in {AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW}:
            return "skipped: appointment is no longer active"
        body = str(
            payload.get("body")
            or f"Reminder from {business.name}: your {appointment.service_type or 'service'} appointment is {appointment.scheduled_date} at {appointment.scheduled_time}. Reply STOP to opt out."
        )
        result = await _send_customer_sms_once(db, job, business, lead, body, purpose="conversation")
        if payload.get("reminder") == "24h":
            appointment.reminder_24h_sent_at = utcnow()
        elif payload.get("reminder") == "1h":
            appointment.reminder_1h_sent_at = utcnow()
        return result

    raise ValueError(f"Unsupported automation job kind: {job.kind}")


async def _mark_failure(db, job: AutomationJob, error: Exception) -> None:
    # A customer SMS in "sending" is fundamentally ambiguous.  It must not be
    # retried automatically even if Twilio timed out after accepting the send.
    if job.status == "sending" or job.kind in CUSTOMER_SMS_KINDS:
        job.status = "manual_review"
    elif job.attempts >= job.max_attempts:
        job.status = "failed"
    else:
        job.status = "queued"
        job.run_at = utcnow() + timedelta(minutes=min(2 ** job.attempts, 60))
    job.last_error = str(error)[:2000]
    job.locked_at = None
    await db.commit()


async def _process_job(job_id: UUID) -> None:
    async with async_session() as db:
        result = await db.execute(
            select(AutomationJob).where(AutomationJob.id == job_id).with_for_update()
        )
        job = result.scalar_one_or_none()
        if not job or job.status != "processing":
            return
        try:
            outcome = await _run_job(db, job)
            job.status = "completed"
            job.completed_at = utcnow()
            job.locked_at = None
            job.last_error = None if not outcome.startswith("skipped:") else outcome
            await db.commit()
            logger.info("Completed automation job %s (%s): %s", job.id, job.kind, outcome)
        except Exception as error:
            await db.rollback()
            # Reload the durable state, especially if _send_customer_sms_once
            # committed its `sending` intent before contacting Twilio.
            reloaded = await db.execute(
                select(AutomationJob).where(AutomationJob.id == job_id).with_for_update()
            )
            fresh_job = reloaded.scalar_one_or_none()
            if fresh_job:
                await _mark_failure(db, fresh_job, error)
                logger.exception("Automation job %s (%s) failed", fresh_job.id, fresh_job.kind)


async def process_due_jobs() -> int:
    """Run one worker tick and return how many jobs were claimed."""
    await _recover_stale_jobs()
    job_ids = await _claim_due_job_ids()
    for job_id in job_ids:
        await _process_job(job_id)
    return len(job_ids)


async def run_forever() -> None:
    logger.info("Revorax automation worker started")
    while True:
        try:
            claimed = await process_due_jobs()
            await asyncio.sleep(0.1 if claimed else settings.AUTOMATION_WORKER_POLL_SECONDS)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Automation worker tick failed")
            await asyncio.sleep(settings.AUTOMATION_WORKER_POLL_SECONDS)


def main() -> None:
    logging.basicConfig(
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    )
    asyncio.run(run_forever())


if __name__ == "__main__":
    main()
