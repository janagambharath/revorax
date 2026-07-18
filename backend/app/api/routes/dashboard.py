"""
Lead & Dashboard routes — the owner-facing API.

This is what powers the dashboard. Every HVAC owner sees:
- New leads (with AI summaries)
- Call history
- SMS threads
- Basic stats
"""

from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import (
    User,
    Business,
    Lead,
    LeadStatus,
    Urgency,
    CallLog,
    SMSMessage,
    Appointment,
    AppointmentStatus,
    AutomationJob,
)
from app.schemas.schemas import (
    LeadResponse,
    LeadUpdateStatus,
    LeadUpdate,
    CallbackSchedule,
    OutboundSMSRequest,
    CallLogResponse,
    SMSMessageResponse,
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdateStatus,
    AppointmentComplete,
    DashboardStats,
    RevenueAnalytics,
)
from app.services.automation_service import can_send_automated_sms, enqueue_job, get_sms_consent
from app.services.business_rules import business_timezone

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


async def _get_business(user: User, db: AsyncSession) -> Business:
    """Helper: get the business for the current user or 404."""
    result = await db.execute(
        select(Business).where(Business.owner_id == user.id)
    )
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="No business found")
    return business


async def _queue_crm_event(
    db: AsyncSession,
    *,
    business: Business,
    lead: Lead | None,
    event_type: str,
    metadata: dict | None = None,
) -> None:
    """Queue a signed CRM webhook after the surrounding request commits."""
    if not business.crm_webhook_url:
        return
    await enqueue_job(
        db,
        business_id=business.id,
        lead_id=lead.id if lead else None,
        kind="crm_sync",
        idempotency_key=f"crm:{event_type}:{lead.id if lead else business.id}:{uuid4().hex}",
        payload={"event_type": event_type, "metadata": metadata or {}},
    )


async def _get_tenant_lead(
    db: AsyncSession, business_id: UUID, lead_id: UUID
) -> Lead:
    result = await db.execute(
        select(Lead).where(and_(Lead.id == lead_id, Lead.business_id == business_id))
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


async def _schedule_appointment_reminders(
    db: AsyncSession,
    *,
    business: Business,
    appointment: Appointment,
    lead: Lead | None,
) -> None:
    """Queue 24-hour and one-hour reminders when a valid future slot exists."""
    if not lead or not appointment.scheduled_date or not appointment.scheduled_time:
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


# ── Leads ────────────────────────────────────────────────


@router.get("/leads", response_model=list[LeadResponse])
async def list_leads(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List leads for the current business, newest first."""
    business = await _get_business(current_user, db)

    query = select(Lead).where(Lead.business_id == business.id)
    if status_filter:
        query = query.where(Lead.status == status_filter)
    query = query.order_by(Lead.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single lead with full details."""
    business = await _get_business(current_user, db)
    lead = await _get_tenant_lead(db, business.id, lead_id)
    return lead


@router.patch("/leads/{lead_id}/status", response_model=LeadResponse)
async def update_lead_status(
    lead_id: UUID,
    data: LeadUpdateStatus,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a lead's status (e.g., new → contacted → booked)."""
    business = await _get_business(current_user, db)
    lead = await _get_tenant_lead(db, business.id, lead_id)

    status_changed = lead.status != data.status
    lead.status = data.status
    if status_changed:
        await _queue_crm_event(
            db,
            business=business,
            lead=lead,
            event_type="lead.status_changed",
            metadata={"status": data.status},
        )
    await db.flush()
    await db.refresh(lead)
    return lead


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    data: LeadUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Let an owner correct intake details without crossing tenant bounds."""
    business = await _get_business(current_user, db)
    lead = await _get_tenant_lead(db, business.id, lead_id)
    changes = data.model_dump(exclude_unset=True)
    if "caller_email" in changes and changes["caller_email"] is not None:
        changes["caller_email"] = str(changes["caller_email"])
    if "urgency" in changes and changes["urgency"] is not None:
        changes["urgency"] = Urgency(changes["urgency"])
    for field, value in changes.items():
        setattr(lead, field, value)
    if changes:
        await _queue_crm_event(
            db,
            business=business,
            lead=lead,
            event_type="lead.updated",
            metadata={"fields": sorted(changes.keys())},
        )
    await db.flush()
    await db.refresh(lead)
    return lead


@router.post("/leads/{lead_id}/callback", response_model=LeadResponse, status_code=202)
async def schedule_callback(
    lead_id: UUID,
    data: CallbackSchedule,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a durable dispatcher task; the pilot never auto-dials customers."""
    business = await _get_business(current_user, db)
    lead = await _get_tenant_lead(db, business.id, lead_id)
    run_at = data.scheduled_for or datetime.now(timezone.utc)
    if run_at.tzinfo is None:
        run_at = run_at.replace(tzinfo=timezone.utc)
    lead.next_follow_up_at = run_at
    await enqueue_job(
        db,
        business_id=business.id,
        lead_id=lead.id,
        kind="callback_task",
        idempotency_key=f"callback:{lead.id}:{run_at.isoformat()}",
        run_at=run_at,
        payload={"summary": data.notes or f"Call {lead.caller_phone} back at the scheduled time."},
    )
    await _queue_crm_event(
        db,
        business=business,
        lead=lead,
        event_type="lead.callback_scheduled",
        metadata={"scheduled_for": run_at.isoformat()},
    )
    await db.flush()
    await db.refresh(lead)
    return lead


@router.post("/leads/{lead_id}/sms", status_code=202)
async def send_lead_sms(
    lead_id: UUID,
    data: OutboundSMSRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Queue an owner-authored customer-service text and honor STOP suppression."""
    business = await _get_business(current_user, db)
    lead = await _get_tenant_lead(db, business.id, lead_id)
    consent = await get_sms_consent(db, business.id, lead.caller_phone)
    if not can_send_automated_sms(consent, purpose="manual"):
        raise HTTPException(
            status_code=409,
            detail="This customer has not consented to text messaging or has opted out. Call them instead.",
        )
    job, created = await enqueue_job(
        db,
        business_id=business.id,
        lead_id=lead.id,
        kind="follow_up_sms",
        idempotency_key=f"owner-sms:{lead.id}:{uuid4().hex}",
        payload={"body": data.body.strip(), "purpose": "manual"},
        max_attempts=1,
    )
    return {"status": "queued", "job_id": str(job.id), "created": created}


# ── Call Log ─────────────────────────────────────────────


@router.get("/calls", response_model=list[CallLogResponse])
async def list_calls(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List call history, newest first."""
    business = await _get_business(current_user, db)
    result = await db.execute(
        select(CallLog)
        .where(CallLog.business_id == business.id)
        .order_by(CallLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


# ── SMS ──────────────────────────────────────────────────


@router.get("/sms/{lead_id}", response_model=list[SMSMessageResponse])
async def get_sms_thread(
    lead_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the SMS conversation thread for a specific lead."""
    business = await _get_business(current_user, db)
    result = await db.execute(
        select(SMSMessage)
        .where(
            and_(
                SMSMessage.business_id == business.id,
                SMSMessage.lead_id == lead_id,
            )
        )
        .order_by(SMSMessage.created_at.asc())
    )
    return result.scalars().all()


# ── Appointments ─────────────────────────────────────────


@router.post("/appointments", response_model=AppointmentResponse, status_code=201)
async def create_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a tenant-safe appointment and queue its operational follow-up."""
    business = await _get_business(current_user, db)

    try:
        date.fromisoformat(data.scheduled_date)
        time.fromisoformat(data.scheduled_time)
    except ValueError:
        raise HTTPException(status_code=422, detail="Appointment date or time is invalid")

    lead = None
    if data.lead_id:
        # This explicitly prevents a tenant from booking against another
        # business's lead, the most serious pre-launch authorization gap.
        lead = await _get_tenant_lead(db, business.id, data.lead_id)

    existing_result = await db.execute(
        select(Appointment.id).where(
            Appointment.business_id == business.id,
            Appointment.scheduled_date == data.scheduled_date,
            Appointment.scheduled_time == data.scheduled_time,
            Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]),
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="That appointment slot is no longer available")

    appointment = Appointment(
        business_id=business.id,
        lead_id=data.lead_id,
        scheduled_date=data.scheduled_date,
        scheduled_time=data.scheduled_time,
        service_type=data.service_type,
        notes=data.notes,
        booking_source=data.booking_source,
    )
    try:
        async with db.begin_nested():
            db.add(appointment)
            await db.flush()
    except IntegrityError:
        raise HTTPException(status_code=409, detail="That appointment slot is no longer available")
    await db.refresh(appointment)

    # Update lead status to booked if linked
    if lead:
        lead.status = LeadStatus.BOOKED
        await _schedule_appointment_reminders(
            db,
            business=business,
            appointment=appointment,
            lead=lead,
        )
        await _queue_crm_event(
            db,
            business=business,
            lead=lead,
            event_type="appointment.booked",
            metadata={
                "appointment_id": str(appointment.id),
                "scheduled_date": appointment.scheduled_date,
                "scheduled_time": appointment.scheduled_time,
            },
        )
        await enqueue_job(
            db,
            business_id=business.id,
            lead_id=lead.id,
            kind="owner_notification",
            idempotency_key=f"appointment-owner-notification:{appointment.id}",
            payload={"summary": f"Appointment booked for {appointment.scheduled_date} at {appointment.scheduled_time}."},
        )

    return appointment


@router.get("/appointments", response_model=list[AppointmentResponse])
async def list_appointments(
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List upcoming appointments."""
    business = await _get_business(current_user, db)
    result = await db.execute(
        select(Appointment)
        .where(Appointment.business_id == business.id)
        .order_by(Appointment.scheduled_date.asc(), Appointment.scheduled_time.asc())
        .limit(limit)
    )
    return result.scalars().all()


@router.patch("/appointments/{appt_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appt_id: UUID,
    data: AppointmentUpdateStatus,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update appointment status."""
    business = await _get_business(current_user, db)
    result = await db.execute(
        select(Appointment).where(
            and_(Appointment.id == appt_id, Appointment.business_id == business.id)
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if data.status == AppointmentStatus.COMPLETED.value:
        raise HTTPException(
            status_code=422,
            detail="Use the completion endpoint to record completed-job revenue and review handling.",
        )
    current_status = getattr(appt.status, "value", appt.status)
    if current_status == data.status:
        return appt
    if current_status == AppointmentStatus.COMPLETED.value:
        raise HTTPException(
            status_code=409,
            detail="A completed job is immutable. Create a correction workflow instead of changing its appointment status.",
        )
    if current_status in {AppointmentStatus.CANCELLED.value, AppointmentStatus.NO_SHOW.value}:
        raise HTTPException(
            status_code=409,
            detail="A cancelled or no-show appointment is closed. Create a new appointment to reschedule it.",
        )

    next_status = AppointmentStatus(data.status)
    appt.status = next_status
    if next_status in {AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW} and appt.lead_id:
        lead = await _get_tenant_lead(db, business.id, appt.lead_id)
        if lead.status != LeadStatus.LOST:
            lead.status = LeadStatus.CONTACTED
        lead.next_follow_up_at = datetime.now(timezone.utc)
        recovery_label = "cancelled" if next_status == AppointmentStatus.CANCELLED else "was marked as a no-show"
        await _queue_crm_event(
            db,
            business=business,
            lead=lead,
            event_type=f"appointment.{next_status.value}",
            metadata={"appointment_id": str(appt.id), "status": next_status.value},
        )
        await enqueue_job(
            db,
            business_id=business.id,
            lead_id=lead.id,
            kind="owner_notification",
            idempotency_key=f"appointment-recovery-owner:{appt.id}:{next_status.value}",
            payload={
                "summary": (
                    f"Appointment on {appt.scheduled_date} at {appt.scheduled_time} {recovery_label}. "
                    f"Follow up with {lead.caller_name or lead.caller_phone} to reschedule."
                )
            },
        )
        # This is consent- and feature-gated by the worker.  If the customer
        # has not opted in or SMS automation is disabled, it is recorded as a
        # skipped job and the owner notification remains the human fallback.
        await enqueue_job(
            db,
            business_id=business.id,
            lead_id=lead.id,
            kind="follow_up_sms",
            idempotency_key=f"appointment-recovery-sms:{appt.id}:{next_status.value}",
            payload={
                "body": (
                    f"Hi, this is {business.name}. Your service appointment needs a new time. "
                    "Reply with a time that works for you, or call us to reschedule. Reply STOP to opt out."
                ),
                "purpose": "conversation",
            },
            max_attempts=1,
        )
    await db.flush()
    await db.refresh(appt)
    return appt


@router.post("/appointments/{appt_id}/complete", response_model=AppointmentResponse)
async def complete_appointment(
    appt_id: UUID,
    data: AppointmentComplete,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record realized revenue, sync CRM, and safely schedule a review request."""
    business = await _get_business(current_user, db)
    result = await db.execute(
        select(Appointment).where(
            and_(Appointment.id == appt_id, Appointment.business_id == business.id)
        )
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    current_status = getattr(appointment.status, "value", appointment.status)
    if current_status == AppointmentStatus.COMPLETED.value:
        if appointment.actual_revenue != data.actual_revenue:
            raise HTTPException(
                status_code=409,
                detail="Completed-job revenue is already recorded and cannot be changed through this endpoint.",
            )
        return appointment
    if current_status not in {
        AppointmentStatus.CONFIRMED.value,
        AppointmentStatus.REMINDED.value,
    }:
        raise HTTPException(
            status_code=409,
            detail="Only a confirmed or reminded appointment can be completed.",
        )

    appointment.status = AppointmentStatus.COMPLETED
    appointment.actual_revenue = data.actual_revenue
    lead = None
    if appointment.lead_id:
        lead = await _get_tenant_lead(db, business.id, appointment.lead_id)
        lead.actual_revenue = data.actual_revenue
        await _queue_crm_event(
            db,
            business=business,
            lead=lead,
            event_type="job.completed",
            metadata={"appointment_id": str(appointment.id), "actual_revenue": data.actual_revenue},
        )
        if data.send_review_request and business.review_request_enabled:
            review_at = datetime.now(timezone.utc) + timedelta(
                hours=business.review_request_delay_hours or 24
            )
            await enqueue_job(
                db,
                business_id=business.id,
                lead_id=lead.id,
                kind="review_request",
                idempotency_key=f"review-request:{appointment.id}",
                run_at=review_at,
                payload={"appointment_id": str(appointment.id)},
                max_attempts=1,
            )

    await db.flush()
    await db.refresh(appointment)
    return appointment


# ── Dashboard Stats ──────────────────────────────────────


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Quick stats for the dashboard header.
    Shows the owner the value they're getting at a glance.
    """
    business = await _get_business(current_user, db)
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)

    # Leads today
    result = await db.execute(
        select(func.count(Lead.id)).where(
            and_(Lead.business_id == business.id, Lead.created_at >= today_start)
        )
    )
    leads_today = result.scalar() or 0

    # Leads this week
    result = await db.execute(
        select(func.count(Lead.id)).where(
            and_(Lead.business_id == business.id, Lead.created_at >= week_start)
        )
    )
    leads_this_week = result.scalar() or 0

    # Leads this month
    result = await db.execute(
        select(func.count(Lead.id)).where(
            and_(Lead.business_id == business.id, Lead.created_at >= month_start)
        )
    )
    leads_this_month = result.scalar() or 0

    # Calls today
    result = await db.execute(
        select(func.count(CallLog.id)).where(
            and_(CallLog.business_id == business.id, CallLog.created_at >= today_start)
        )
    )
    calls_today = result.scalar() or 0

    # Missed calls today
    result = await db.execute(
        select(func.count(CallLog.id)).where(
            and_(
                CallLog.business_id == business.id,
                CallLog.created_at >= today_start,
                CallLog.status == "missed",
            )
        )
    )
    missed_calls_today = result.scalar() or 0

    # Upcoming appointments
    result = await db.execute(
        select(func.count(Appointment.id)).where(
            and_(
                Appointment.business_id == business.id,
                Appointment.status.in_(["confirmed", "reminded"]),
            )
        )
    )
    appointments_upcoming = result.scalar() or 0

    # Leads by status
    result = await db.execute(
        select(Lead.status, func.count(Lead.id))
        .where(Lead.business_id == business.id)
        .group_by(Lead.status)
    )
    leads_by_status = {row[0]: row[1] for row in result.all()}

    result = await db.execute(
        select(func.count(Lead.id)).where(
            and_(
                Lead.business_id == business.id,
                Lead.created_at >= month_start,
                Lead.status == LeadStatus.BOOKED,
            )
        )
    )
    booked_leads_this_month = result.scalar() or 0

    result = await db.execute(
        select(func.count(Appointment.id)).where(
            and_(
                Appointment.business_id == business.id,
                Appointment.updated_at >= month_start,
                Appointment.status == AppointmentStatus.COMPLETED,
            )
        )
    )
    completed_jobs_this_month = result.scalar() or 0

    result = await db.execute(
        select(func.coalesce(func.sum(Appointment.actual_revenue), 0.0)).where(
            and_(
                Appointment.business_id == business.id,
                Appointment.updated_at >= month_start,
                Appointment.status == AppointmentStatus.COMPLETED,
            )
        )
    )
    revenue_this_month = float(result.scalar() or 0.0)

    result = await db.execute(
        select(func.count(AutomationJob.id)).where(
            and_(
                AutomationJob.business_id == business.id,
                AutomationJob.kind == "callback_task",
                AutomationJob.status.in_(["queued", "processing", "manual_review"]),
            )
        )
    )
    pending_callbacks = result.scalar() or 0

    conversion_rate = round((booked_leads_this_month / leads_this_month) * 100, 1) if leads_this_month else 0.0

    return DashboardStats(
        leads_today=leads_today,
        leads_this_week=leads_this_week,
        leads_this_month=leads_this_month,
        calls_today=calls_today,
        missed_calls_today=missed_calls_today,
        appointments_upcoming=appointments_upcoming,
        leads_by_status={str(getattr(key, "value", key)): value for key, value in leads_by_status.items()},
        booked_leads_this_month=booked_leads_this_month,
        completed_jobs_this_month=completed_jobs_this_month,
        revenue_this_month=revenue_this_month,
        conversion_rate=conversion_rate,
        pending_callbacks=pending_callbacks,
    )


@router.get("/analytics/revenue", response_model=RevenueAnalytics)
async def get_revenue_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Report booked conversion, pipeline, and realized revenue for one tenant."""
    business = await _get_business(current_user, db)
    period_start = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.business_id == business.id, Lead.created_at >= period_start
        )
    )
    leads = result.scalar() or 0
    result = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.business_id == business.id,
            Lead.created_at >= period_start,
            Lead.status == LeadStatus.BOOKED,
        )
    )
    booked_leads = result.scalar() or 0
    result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.business_id == business.id,
            Appointment.updated_at >= period_start,
            Appointment.status == AppointmentStatus.COMPLETED,
        )
    )
    completed_jobs = result.scalar() or 0
    result = await db.execute(
        select(func.coalesce(func.sum(Lead.estimated_value), 0.0)).where(
            Lead.business_id == business.id,
            Lead.created_at >= period_start,
            Lead.status != LeadStatus.LOST,
        )
    )
    estimated_pipeline_value = float(result.scalar() or 0.0)
    result = await db.execute(
        select(func.coalesce(func.sum(Appointment.actual_revenue), 0.0)).where(
            Appointment.business_id == business.id,
            Appointment.updated_at >= period_start,
            Appointment.status == AppointmentStatus.COMPLETED,
        )
    )
    realized_revenue = float(result.scalar() or 0.0)
    return RevenueAnalytics(
        period_start=period_start,
        leads=leads,
        booked_leads=booked_leads,
        completed_jobs=completed_jobs,
        estimated_pipeline_value=estimated_pipeline_value,
        realized_revenue=realized_revenue,
        conversion_rate=round((booked_leads / leads) * 100, 1) if leads else 0.0,
    )
