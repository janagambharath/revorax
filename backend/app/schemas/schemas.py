"""
Pydantic schemas for API request/response validation.

These are the contracts between frontend and backend.
Keep them tight — only expose what the dashboard needs.
"""

from datetime import datetime
from uuid import UUID
from typing import Optional
from urllib.parse import urlparse

from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Auth ─────────────────────────────────────────────────


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    phone: Optional[str] = None
    invite_code: Optional[str] = Field(None, max_length=128)


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
    service_area_zip_codes: Optional[list[str]] = None
    faqs: Optional[list[dict]] = None
    call_transfer_number: Optional[str] = Field(None, max_length=20)
    auto_booking_enabled: bool = False
    appointment_slot_minutes: int = Field(default=60, ge=15, le=480)
    minimum_notice_minutes: int = Field(default=60, ge=0, le=10080)
    review_request_enabled: bool = False
    review_request_delay_hours: int = Field(default=24, ge=1, le=720)
    crm_webhook_url: Optional[str] = Field(None, max_length=500)
    timezone: str = "America/New_York"

    @field_validator("service_area_zip_codes")
    @classmethod
    def validate_service_area_zip_codes(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        if value is None:
            return value
        if len(value) > 500:
            raise ValueError("A business can configure at most 500 service-area ZIP codes")
        normalized = []
        for zip_code in value:
            digits = "".join(character for character in str(zip_code) if character.isdigit())
            if len(digits) < 5:
                raise ValueError("Each service-area ZIP code must contain five digits")
            normalized.append(digits[:5])
        return list(dict.fromkeys(normalized))

    @field_validator("faqs")
    @classmethod
    def validate_faqs(cls, value: Optional[list[dict]]) -> Optional[list[dict]]:
        if value is None:
            return value
        if len(value) > 30:
            raise ValueError("A business can configure at most 30 FAQs")
        sanitized: list[dict] = []
        for item in value:
            question = str(item.get("question", "")).strip() if isinstance(item, dict) else ""
            answer = str(item.get("answer", "")).strip() if isinstance(item, dict) else ""
            if not question or not answer:
                raise ValueError("Each FAQ needs both a question and answer")
            sanitized.append({"question": question[:500], "answer": answer[:1000]})
        return sanitized

    @field_validator("crm_webhook_url")
    @classmethod
    def validate_crm_webhook_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return None
        parsed = urlparse(value.strip())
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError("CRM webhook URL must be a public HTTPS URL without embedded credentials")
        hostname = parsed.hostname.lower()
        if hostname in {"localhost", "localhost.localdomain"} or hostname.endswith(".local"):
            raise ValueError("CRM webhook URL must not target a local address")
        return value.strip()


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
    service_area_zip_codes: Optional[list[str]] = None
    faqs: Optional[list[dict]] = None
    greeting_message: Optional[str] = None
    call_transfer_number: Optional[str] = Field(None, max_length=20)
    auto_booking_enabled: Optional[bool] = None
    appointment_slot_minutes: Optional[int] = Field(None, ge=15, le=480)
    minimum_notice_minutes: Optional[int] = Field(None, ge=0, le=10080)
    review_request_enabled: Optional[bool] = None
    review_request_delay_hours: Optional[int] = Field(None, ge=1, le=720)
    crm_webhook_url: Optional[str] = Field(None, max_length=500)
    timezone: Optional[str] = None

    _validate_service_area_zip_codes = field_validator("service_area_zip_codes")(BusinessCreate.validate_service_area_zip_codes)
    _validate_faqs = field_validator("faqs")(BusinessCreate.validate_faqs)
    _validate_crm_webhook_url = field_validator("crm_webhook_url")(BusinessCreate.validate_crm_webhook_url)


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
    service_area_zip_codes: Optional[list]
    faqs: Optional[list]
    greeting_message: Optional[str]
    timezone: str
    call_transfer_number: Optional[str]
    auto_booking_enabled: bool
    appointment_slot_minutes: int
    minimum_notice_minutes: int
    review_request_enabled: bool
    review_request_delay_hours: int
    crm_webhook_url: Optional[str]
    twilio_phone_number: Optional[str]
    plan: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TwilioNumberAttach(BaseModel):
    business_id: UUID
    phone_number: str = Field(min_length=7, max_length=20)


# ── Leads ────────────────────────────────────────────────


class LeadResponse(BaseModel):
    id: UUID
    source: str
    caller_name: Optional[str]
    caller_phone: str
    caller_email: Optional[str]
    caller_address: Optional[str]
    zip_code: Optional[str]
    service_type: Optional[str]
    urgency: str
    preferred_time: Optional[str]
    notes: Optional[str]
    transcript: Optional[str]
    ai_summary: Optional[str]
    estimated_value: Optional[float]
    actual_revenue: Optional[float]
    consent_status: str
    last_contacted_at: Optional[datetime]
    next_follow_up_at: Optional[datetime]
    crm_synced_at: Optional[datetime]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LeadUpdateStatus(BaseModel):
    status: str = Field(pattern="^(new|contacted|booked|lost)$")


class LeadUpdate(BaseModel):
    caller_name: Optional[str] = Field(None, max_length=255)
    caller_email: Optional[EmailStr] = None
    caller_address: Optional[str] = Field(None, max_length=500)
    zip_code: Optional[str] = Field(None, max_length=10)
    service_type: Optional[str] = Field(None, max_length=255)
    urgency: Optional[str] = Field(None, pattern="^(emergency|soon|flexible|unknown)$")
    preferred_time: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=5000)
    estimated_value: Optional[float] = Field(None, ge=0)


class CallbackSchedule(BaseModel):
    scheduled_for: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=1000)


class OutboundSMSRequest(BaseModel):
    body: str = Field(min_length=1, max_length=1600)


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
    ai_summary: Optional[str]
    action_taken: Optional[str]
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
    twilio_message_sid: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Appointments ─────────────────────────────────────────


class AppointmentCreate(BaseModel):
    lead_id: Optional[UUID] = None
    scheduled_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    scheduled_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    service_type: Optional[str] = None
    notes: Optional[str] = None
    booking_source: str = Field(default="manual", max_length=50)


class AppointmentResponse(BaseModel):
    id: UUID
    lead_id: Optional[UUID]
    scheduled_date: Optional[str]
    scheduled_time: Optional[str]
    service_type: Optional[str]
    notes: Optional[str]
    booking_source: str
    actual_revenue: Optional[float]
    customer_confirmed_at: Optional[datetime]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AppointmentUpdateStatus(BaseModel):
    status: str = Field(
        pattern="^(confirmed|reminded|completed|no_show|cancelled)$"
    )


class AppointmentComplete(BaseModel):
    actual_revenue: float = Field(ge=0)
    send_review_request: bool = True


# ── Dashboard Stats ──────────────────────────────────────


class DashboardStats(BaseModel):
    leads_today: int
    leads_this_week: int
    leads_this_month: int
    calls_today: int
    missed_calls_today: int
    appointments_upcoming: int
    leads_by_status: dict[str, int]
    booked_leads_this_month: int
    completed_jobs_this_month: int
    revenue_this_month: float
    conversion_rate: float
    pending_callbacks: int


class RevenueAnalytics(BaseModel):
    period_start: datetime
    leads: int
    booked_leads: int
    completed_jobs: int
    estimated_pipeline_value: float
    realized_revenue: float
    conversion_rate: float
