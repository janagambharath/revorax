"""
Pydantic schemas for API request/response validation.

These are the contracts between frontend and backend.
Keep them tight — only expose what the dashboard needs.
"""

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ── Auth ─────────────────────────────────────────────────


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    phone: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Business ────────────────────────────────────────────


class BusinessCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = Field(None, max_length=2)
    zip_code: Optional[str] = Field(None, max_length=10)
    business_phone: Optional[str] = None
    website: Optional[str] = None
    business_hours: Optional[dict] = None
    services_offered: Optional[list[str]] = None
    timezone: str = "America/New_York"


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    business_phone: Optional[str] = None
    website: Optional[str] = None
    business_hours: Optional[dict] = None
    services_offered: Optional[list[str]] = None
    greeting_message: Optional[str] = None
    timezone: Optional[str] = None


class BusinessResponse(BaseModel):
    id: UUID
    name: str
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[str]
    business_phone: Optional[str]
    website: Optional[str]
    business_hours: Optional[dict]
    services_offered: Optional[list]
    greeting_message: Optional[str]
    timezone: str
    twilio_phone_number: Optional[str]
    plan: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Leads ────────────────────────────────────────────────


class LeadResponse(BaseModel):
    id: UUID
    source: str
    caller_name: Optional[str]
    caller_phone: str
    caller_email: Optional[str]
    zip_code: Optional[str]
    service_type: Optional[str]
    urgency: str
    preferred_time: Optional[str]
    notes: Optional[str]
    transcript: Optional[str]
    ai_summary: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LeadUpdateStatus(BaseModel):
    status: str = Field(pattern="^(new|contacted|booked|lost)$")


# ── Call Log ─────────────────────────────────────────────


class CallLogResponse(BaseModel):
    id: UUID
    lead_id: Optional[UUID]
    twilio_call_sid: str
    direction: str
    from_number: str
    to_number: str
    duration_seconds: Optional[int]
    recording_url: Optional[str]
    transcription: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── SMS ──────────────────────────────────────────────────


class SMSMessageResponse(BaseModel):
    id: UUID
    lead_id: Optional[UUID]
    direction: str
    from_number: str
    to_number: str
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Appointments ─────────────────────────────────────────


class AppointmentCreate(BaseModel):
    lead_id: Optional[UUID] = None
    scheduled_date: str  # YYYY-MM-DD
    scheduled_time: str  # HH:MM
    service_type: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: UUID
    lead_id: Optional[UUID]
    scheduled_date: Optional[str]
    scheduled_time: Optional[str]
    service_type: Optional[str]
    notes: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AppointmentUpdateStatus(BaseModel):
    status: str = Field(
        pattern="^(confirmed|reminded|completed|no_show|cancelled)$"
    )


# ── Dashboard Stats ──────────────────────────────────────


class DashboardStats(BaseModel):
    leads_today: int
    leads_this_week: int
    leads_this_month: int
    calls_today: int
    missed_calls_today: int
    appointments_upcoming: int
    leads_by_status: dict[str, int]
