"""
Lead & Dashboard routes — the owner-facing API.

This is what powers the dashboard. Every HVAC owner sees:
- New leads (with AI summaries)
- Call history
- SMS threads
- Basic stats
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import (
    User,
    Business,
    Lead,
    LeadStatus,
    CallLog,
    SMSMessage,
    Appointment,
    AppointmentStatus,
)
from app.schemas.schemas import (
    LeadResponse,
    LeadUpdateStatus,
    CallLogResponse,
    SMSMessageResponse,
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdateStatus,
    DashboardStats,
)

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
    result = await db.execute(
        select(Lead).where(
            and_(Lead.id == lead_id, Lead.business_id == business.id)
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
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
    result = await db.execute(
        select(Lead).where(
            and_(Lead.id == lead_id, Lead.business_id == business.id)
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.status = data.status
    await db.flush()
    await db.refresh(lead)
    return lead


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
    """Manually create an appointment (from the dashboard)."""
    business = await _get_business(current_user, db)

    appointment = Appointment(
        business_id=business.id,
        lead_id=data.lead_id,
        scheduled_date=data.scheduled_date,
        scheduled_time=data.scheduled_time,
        service_type=data.service_type,
        notes=data.notes,
    )
    db.add(appointment)
    await db.flush()
    await db.refresh(appointment)

    # Update lead status to booked if linked
    if data.lead_id:
        result = await db.execute(select(Lead).where(Lead.id == data.lead_id))
        lead = result.scalar_one_or_none()
        if lead:
            lead.status = LeadStatus.BOOKED

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

    appt.status = data.status
    await db.flush()
    await db.refresh(appt)
    return appt


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

    return DashboardStats(
        leads_today=leads_today,
        leads_this_week=leads_this_week,
        leads_this_month=leads_this_month,
        calls_today=calls_today,
        missed_calls_today=missed_calls_today,
        appointments_upcoming=appointments_upcoming,
        leads_by_status=leads_by_status,
    )
