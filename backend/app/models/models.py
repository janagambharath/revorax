"""
SQLAlchemy models for Revorax.

These map directly to the schema in the implementation plan.
Every table has a clear business purpose:
- businesses: the customer (HVAC company)
- leads: every potential job captured
- appointments: booked jobs
- call_log: Twilio call records
- sms_messages: Twilio SMS records
- users: owner accounts for dashboard access
"""

import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    JSON,
    Float,
    Index,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


# ── Enums ────────────────────────────────────────────────


class BusinessPlan(str, enum.Enum):
    STARTER = "starter"
    PRO = "pro"


class BusinessStatus(str, enum.Enum):
    ONBOARDING = "onboarding"
    ACTIVE = "active"
    PAUSED = "paused"
    CHURNED = "churned"


class LeadSource(str, enum.Enum):
    MISSED_CALL = "missed_call"
    VOICEMAIL = "voicemail"
    SMS = "sms"
    WEB = "web"


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    BOOKED = "booked"
    LOST = "lost"


class Urgency(str, enum.Enum):
    EMERGENCY = "emergency"
    SOON = "soon"
    FLEXIBLE = "flexible"
    UNKNOWN = "unknown"


class CallDirection(str, enum.Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class CallStatus(str, enum.Enum):
    ANSWERED = "answered"
    MISSED = "missed"
    VOICEMAIL = "voicemail"


class SMSDirection(str, enum.Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class AppointmentStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    REMINDED = "reminded"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


def enum_values(enum_class: type[enum.Enum]) -> list[str]:
    """Persist the enum values used by the API instead of Python member names."""
    return [member.value for member in enum_class]


# ── Models ───────────────────────────────────────────────


class User(Base):
    """Dashboard user account — maps 1:1 to a business owner."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    business = relationship("Business", back_populates="owner", uselist=False)


class Business(Base):
    """
    An HVAC company using Revorax.
    This is the core tenant — everything else hangs off this.
    """

    __tablename__ = "businesses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True
    )

    # Business info
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(10), nullable=True)
    business_phone = Column(String(20), nullable=True)
    website = Column(String(500), nullable=True)

    # Configuration
    business_hours = Column(JSON, nullable=True)  # {"mon": {"open": "08:00", "close": "17:00"}, ...}
    services_offered = Column(JSON, nullable=True)  # ["AC Repair", "Furnace Install", ...]
    service_area_zip_codes = Column(JSON, nullable=True)  # ["78701", "78702", ...]
    faqs = Column(JSON, nullable=True)  # [{"question": "...", "answer": "..."}]
    greeting_message = Column(
        Text,
        nullable=True,
        default="Thanks for calling! We missed your call but we'll get back to you shortly.",
    )
    timezone = Column(String(50), default="America/New_York")
    call_transfer_number = Column(String(20), nullable=True)
    auto_booking_enabled = Column(Boolean, default=False)
    appointment_slot_minutes = Column(Integer, default=60)
    minimum_notice_minutes = Column(Integer, default=60)
    review_request_enabled = Column(Boolean, default=False)
    review_request_delay_hours = Column(Integer, default=24)
    crm_webhook_url = Column(String(500), nullable=True)

    # Twilio
    twilio_phone_number = Column(String(20), nullable=True, unique=True)
    twilio_phone_sid = Column(String(50), nullable=True)

    # Stripe
    stripe_customer_id = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)

    # Status
    plan = Column(Enum(BusinessPlan, values_callable=enum_values), default=BusinessPlan.PRO)
    status = Column(Enum(BusinessStatus, values_callable=enum_values), default=BusinessStatus.ONBOARDING)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    owner = relationship("User", back_populates="business")
    leads = relationship("Lead", back_populates="business", cascade="all, delete-orphan")
    calls = relationship("CallLog", back_populates="business", cascade="all, delete-orphan")
    sms_messages = relationship(
        "SMSMessage", back_populates="business", cascade="all, delete-orphan"
    )
    appointments = relationship(
        "Appointment", back_populates="business", cascade="all, delete-orphan"
    )
    sms_consents = relationship("SMSConsent", cascade="all, delete-orphan")
    automation_jobs = relationship("AutomationJob", cascade="all, delete-orphan")


class Lead(Base):
    """
    A potential customer / job captured by Revorax.
    This is the money table — every row is potential revenue for the HVAC company.
    """

    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(
        UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True
    )

    # Source
    source = Column(Enum(LeadSource, values_callable=enum_values), nullable=False)

    # Contact info
    caller_name = Column(String(255), nullable=True)
    caller_phone = Column(String(20), nullable=False)
    caller_email = Column(String(255), nullable=True)

    # Qualification
    zip_code = Column(String(10), nullable=True)
    service_type = Column(String(255), nullable=True)
    urgency = Column(Enum(Urgency, values_callable=enum_values), default=Urgency.UNKNOWN)
    preferred_time = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # AI processing
    transcript = Column(Text, nullable=True)  # Voicemail transcription
    ai_summary = Column(Text, nullable=True)  # LLM qualification summary

    # Revenue tracking
    estimated_value = Column(Float, nullable=True)  # Estimated job value in dollars
    response_time_seconds = Column(Integer, nullable=True)  # How fast auto-text was sent
    caller_address = Column(String(500), nullable=True)
    consent_status = Column(String(20), default="unknown", nullable=False)
    consent_updated_at = Column(DateTime(timezone=True), nullable=True)
    last_contacted_at = Column(DateTime(timezone=True), nullable=True)
    next_follow_up_at = Column(DateTime(timezone=True), nullable=True)
    actual_revenue = Column(Float, nullable=True)
    crm_synced_at = Column(DateTime(timezone=True), nullable=True)

    # Status
    status = Column(Enum(LeadStatus, values_callable=enum_values), default=LeadStatus.NEW, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    business = relationship("Business", back_populates="leads")
    appointment = relationship("Appointment", back_populates="lead", uselist=False)
    calls = relationship("CallLog", back_populates="lead")
    sms_messages = relationship("SMSMessage", back_populates="lead")


class CallLog(Base):
    """Twilio call record — every inbound/outbound call is logged."""

    __tablename__ = "call_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(
        UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True
    )
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True)

    # Twilio data
    twilio_call_sid = Column(String(50), unique=True, nullable=False)
    direction = Column(Enum(CallDirection, values_callable=enum_values), nullable=False)
    from_number = Column(String(20), nullable=False)
    to_number = Column(String(20), nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    recording_url = Column(String(500), nullable=True)
    recording_sid = Column(String(50), nullable=True)
    transcription = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    action_taken = Column(String(50), nullable=True)

    # Status
    status = Column(Enum(CallStatus, values_callable=enum_values), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    business = relationship("Business", back_populates="calls")
    lead = relationship("Lead", back_populates="calls")


class SMSMessage(Base):
    """SMS record — every text sent/received via Twilio."""

    __tablename__ = "sms_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(
        UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True
    )
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True)

    # Twilio data
    twilio_message_sid = Column(String(50), nullable=True, unique=True)
    direction = Column(Enum(SMSDirection, values_callable=enum_values), nullable=False)
    from_number = Column(String(20), nullable=False)
    to_number = Column(String(20), nullable=False)
    body = Column(Text, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    business = relationship("Business", back_populates="sms_messages")
    lead = relationship("Lead", back_populates="sms_messages")


class Appointment(Base):
    """Booked appointment — the ultimate conversion event."""

    __tablename__ = "appointments"
    __table_args__ = (
        # The current scheduler models one dispatch capacity per business.
        # Cancelled/no-show slots become bookable again; multi-technician
        # capacity needs a technician/resource table before widening this.
        Index(
            "uq_appointments_business_active_slot",
            "business_id",
            "scheduled_date",
            "scheduled_time",
            unique=True,
            postgresql_where=text("status NOT IN ('cancelled', 'no_show')"),
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(
        UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True
    )
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True)

    # Appointment details
    scheduled_date = Column(String(10), nullable=True)  # YYYY-MM-DD
    scheduled_time = Column(String(10), nullable=True)  # HH:MM
    service_type = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    booking_source = Column(String(50), default="manual")
    actual_revenue = Column(Float, nullable=True)
    customer_confirmed_at = Column(DateTime(timezone=True), nullable=True)

    # Status
    status = Column(Enum(AppointmentStatus, values_callable=enum_values), default=AppointmentStatus.CONFIRMED)

    # Reminders
    reminder_24h_sent_at = Column(DateTime(timezone=True), nullable=True)
    reminder_1h_sent_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    business = relationship("Business", back_populates="appointments")
    lead = relationship("Lead", back_populates="appointment")


class SMSConsent(Base):
    """Tenant-scoped consent and suppression ledger for caller messaging."""

    __tablename__ = "sms_consents"
    __table_args__ = (
        UniqueConstraint("business_id", "phone_number", name="uq_sms_consents_business_phone"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(
        UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True
    )
    phone_number = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="unknown")
    source = Column(String(100), nullable=True)
    evidence = Column(Text, nullable=True)
    last_keyword = Column(String(20), nullable=True)
    opted_in_at = Column(DateTime(timezone=True), nullable=True)
    opted_out_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AutomationJob(Base):
    """Durable, idempotent work queued outside Twilio request lifecycles."""

    __tablename__ = "automation_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(
        UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True
    )
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True, index=True)
    kind = Column(String(100), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="queued", index=True)
    idempotency_key = Column(String(255), nullable=False, unique=True)
    payload = Column(JSON, nullable=True)
    attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=5)
    run_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    locked_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
