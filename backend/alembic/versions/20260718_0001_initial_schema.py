"""Create the initial Revorax application schema.

Revision ID: 20260718_0001
Revises:
Create Date: 2026-07-18
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260718_0001"
down_revision = None
branch_labels = None
depends_on = None


businessplan = postgresql.ENUM("starter", "pro", name="businessplan", create_type=False)
businessstatus = postgresql.ENUM("onboarding", "active", "paused", "churned", name="businessstatus", create_type=False)
leadsource = postgresql.ENUM("missed_call", "voicemail", "sms", "web", name="leadsource", create_type=False)
leadstatus = postgresql.ENUM("new", "contacted", "booked", "lost", name="leadstatus", create_type=False)
urgency = postgresql.ENUM("emergency", "soon", "flexible", "unknown", name="urgency", create_type=False)
calldirection = postgresql.ENUM("inbound", "outbound", name="calldirection", create_type=False)
callstatus = postgresql.ENUM("answered", "missed", "voicemail", name="callstatus", create_type=False)
smsdirection = postgresql.ENUM("inbound", "outbound", name="smsdirection", create_type=False)
appointmentstatus = postgresql.ENUM("confirmed", "reminded", "completed", "no_show", "cancelled", name="appointmentstatus", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    for enum_type in (
        businessplan,
        businessstatus,
        leadsource,
        leadstatus,
        urgency,
        calldirection,
        callstatus,
        smsdirection,
        appointmentstatus,
    ):
        enum_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "businesses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=2), nullable=True),
        sa.Column("zip_code", sa.String(length=10), nullable=True),
        sa.Column("business_phone", sa.String(length=20), nullable=True),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("business_hours", sa.JSON(), nullable=True),
        sa.Column("services_offered", sa.JSON(), nullable=True),
        sa.Column("greeting_message", sa.Text(), nullable=True),
        sa.Column("timezone", sa.String(length=50), nullable=True),
        sa.Column("twilio_phone_number", sa.String(length=20), nullable=True),
        sa.Column("twilio_phone_sid", sa.String(length=50), nullable=True),
        sa.Column("stripe_customer_id", sa.String(length=100), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(length=100), nullable=True),
        sa.Column("plan", businessplan, nullable=True),
        sa.Column("status", businessstatus, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id"),
        sa.UniqueConstraint("twilio_phone_number"),
    )

    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source", leadsource, nullable=False),
        sa.Column("caller_name", sa.String(length=255), nullable=True),
        sa.Column("caller_phone", sa.String(length=20), nullable=False),
        sa.Column("caller_email", sa.String(length=255), nullable=True),
        sa.Column("zip_code", sa.String(length=10), nullable=True),
        sa.Column("service_type", sa.String(length=255), nullable=True),
        sa.Column("urgency", urgency, nullable=True),
        sa.Column("preferred_time", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("transcript", sa.Text(), nullable=True),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("estimated_value", sa.Float(), nullable=True),
        sa.Column("response_time_seconds", sa.Integer(), nullable=True),
        sa.Column("status", leadstatus, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_leads_business_id"), "leads", ["business_id"], unique=False)
    op.create_index(op.f("ix_leads_status"), "leads", ["status"], unique=False)

    op.create_table(
        "call_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("twilio_call_sid", sa.String(length=50), nullable=False),
        sa.Column("direction", calldirection, nullable=False),
        sa.Column("from_number", sa.String(length=20), nullable=False),
        sa.Column("to_number", sa.String(length=20), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("recording_url", sa.String(length=500), nullable=True),
        sa.Column("recording_sid", sa.String(length=50), nullable=True),
        sa.Column("transcription", sa.Text(), nullable=True),
        sa.Column("status", callstatus, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("twilio_call_sid"),
    )
    op.create_index(op.f("ix_call_log_business_id"), "call_log", ["business_id"], unique=False)

    op.create_table(
        "sms_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("twilio_message_sid", sa.String(length=50), nullable=True),
        sa.Column("direction", smsdirection, nullable=False),
        sa.Column("from_number", sa.String(length=20), nullable=False),
        sa.Column("to_number", sa.String(length=20), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sms_messages_business_id"), "sms_messages", ["business_id"], unique=False)

    op.create_table(
        "appointments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("scheduled_date", sa.String(length=10), nullable=True),
        sa.Column("scheduled_time", sa.String(length=10), nullable=True),
        sa.Column("service_type", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", appointmentstatus, nullable=True),
        sa.Column("reminder_24h_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reminder_1h_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_appointments_business_id"), "appointments", ["business_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_appointments_business_id"), table_name="appointments")
    op.drop_table("appointments")
    op.drop_index(op.f("ix_sms_messages_business_id"), table_name="sms_messages")
    op.drop_table("sms_messages")
    op.drop_index(op.f("ix_call_log_business_id"), table_name="call_log")
    op.drop_table("call_log")
    op.drop_index(op.f("ix_leads_status"), table_name="leads")
    op.drop_index(op.f("ix_leads_business_id"), table_name="leads")
    op.drop_table("leads")
    op.drop_table("businesses")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    for enum_type in (
        appointmentstatus,
        smsdirection,
        callstatus,
        calldirection,
        urgency,
        leadstatus,
        leadsource,
        businessstatus,
        businessplan,
    ):
        enum_type.drop(bind, checkfirst=True)
