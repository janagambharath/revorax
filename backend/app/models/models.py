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
    greeting_message = Column(
        Text,
        nullable=True,
        default="Thanks for calling! We missed your call but we'll get back to you shortly.",
    )
    timezone = Column(String(50), default="America/New_York")

    # Twilio
    twilio_phone_number = Column(String(20), nullable=True, unique=True)
    twilio_phone_sid = Column(String(50), nullable=True)

    # Stripe
    stripe_customer_id = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)

    # Status
    plan = Column(Enum(BusinessPlan), default=BusinessPlan.PRO)
    status = Column(Enum(BusinessStatus), default=BusinessStatus.ONBOARDING)

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
    source = Column(Enum(LeadSource), nullable=False)

    # Contact info
    caller_name = Column(String(255), nullable=True)
    caller_phone = Column(String(20), nullable=False)
    caller_email = Column(String(255), nullable=True)

    # Qualification
    zip_code = Column(String(10), nullable=True)
    service_type = Column(String(255), nullable=True)
    urgency = Column(Enum(Urgency), default=Urgency.UNKNOWN)
    preferred_time = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # AI processing
    transcript = Column(Text, nullable=True)  # Voicemail transcription
    ai_summary = Column(Text, nullable=True)  # LLM qualification summary

    # Status
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, index=True)

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
    direction = Column(Enum(CallDirection), nullable=False)
    from_number = Column(String(20), nullable=False)
    to_number = Column(String(20), nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    recording_url = Column(String(500), nullable=True)
    recording_sid = Column(String(50), nullable=True)
    transcription = Column(Text, nullable=True)

    # Status
    status = Column(Enum(CallStatus), nullable=False)

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
    twilio_message_sid = Column(String(50), nullable=True)
    direction = Column(Enum(SMSDirection), nullable=False)
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

    # Status
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.CONFIRMED)

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
