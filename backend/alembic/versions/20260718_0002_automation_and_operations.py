"""Add automation, consent, and operational workflow data.

Revision ID: 20260718_0002
Revises: 20260718_0001
Create Date: 2026-07-18
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260718_0002"
down_revision = "20260718_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("businesses", sa.Column("service_area_zip_codes", sa.JSON(), nullable=True))
    op.add_column("businesses", sa.Column("faqs", sa.JSON(), nullable=True))
    op.add_column("businesses", sa.Column("call_transfer_number", sa.String(length=20), nullable=True))
    op.add_column("businesses", sa.Column("auto_booking_enabled", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("businesses", sa.Column("appointment_slot_minutes", sa.Integer(), server_default="60", nullable=False))
    op.add_column("businesses", sa.Column("minimum_notice_minutes", sa.Integer(), server_default="60", nullable=False))
    op.add_column("businesses", sa.Column("review_request_enabled", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("businesses", sa.Column("review_request_delay_hours", sa.Integer(), server_default="24", nullable=False))
    op.add_column("businesses", sa.Column("crm_webhook_url", sa.String(length=500), nullable=True))

    op.add_column("leads", sa.Column("caller_address", sa.String(length=500), nullable=True))
    op.add_column("leads", sa.Column("consent_status", sa.String(length=20), server_default="unknown", nullable=False))
    op.add_column("leads", sa.Column("consent_updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("leads", sa.Column("last_contacted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("leads", sa.Column("next_follow_up_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("leads", sa.Column("actual_revenue", sa.Float(), nullable=True))
    op.add_column("leads", sa.Column("crm_synced_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("call_log", sa.Column("ai_summary", sa.Text(), nullable=True))
    op.add_column("call_log", sa.Column("action_taken", sa.String(length=50), nullable=True))

    op.add_column("appointments", sa.Column("booking_source", sa.String(length=50), server_default="manual", nullable=False))
    op.add_column("appointments", sa.Column("actual_revenue", sa.Float(), nullable=True))
    op.add_column("appointments", sa.Column("customer_confirmed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(
        "uq_appointments_business_active_slot",
        "appointments",
        ["business_id", "scheduled_date", "scheduled_time"],
        unique=True,
        postgresql_where=sa.text("status NOT IN ('cancelled', 'no_show')"),
    )

    op.create_unique_constraint("uq_sms_messages_twilio_message_sid", "sms_messages", ["twilio_message_sid"])

    op.create_table(
        "sms_consents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("phone_number", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="unknown"),
        sa.Column("source", sa.String(length=100), nullable=True),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column("last_keyword", sa.String(length=20), nullable=True),
        sa.Column("opted_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("opted_out_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "phone_number", name="uq_sms_consents_business_phone"),
    )
    op.create_index(op.f("ix_sms_consents_business_id"), "sms_consents", ["business_id"], unique=False)

    op.create_table(
        "automation_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("kind", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="queued"),
        sa.Column("idempotency_key", sa.String(length=255), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("run_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("locked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"]),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key"),
    )
    op.create_index(op.f("ix_automation_jobs_business_id"), "automation_jobs", ["business_id"], unique=False)
    op.create_index(op.f("ix_automation_jobs_lead_id"), "automation_jobs", ["lead_id"], unique=False)
    op.create_index(op.f("ix_automation_jobs_kind"), "automation_jobs", ["kind"], unique=False)
    op.create_index(op.f("ix_automation_jobs_status"), "automation_jobs", ["status"], unique=False)
    op.create_index(op.f("ix_automation_jobs_run_at"), "automation_jobs", ["run_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_automation_jobs_run_at"), table_name="automation_jobs")
    op.drop_index(op.f("ix_automation_jobs_status"), table_name="automation_jobs")
    op.drop_index(op.f("ix_automation_jobs_kind"), table_name="automation_jobs")
    op.drop_index(op.f("ix_automation_jobs_lead_id"), table_name="automation_jobs")
    op.drop_index(op.f("ix_automation_jobs_business_id"), table_name="automation_jobs")
    op.drop_table("automation_jobs")
    op.drop_index(op.f("ix_sms_consents_business_id"), table_name="sms_consents")
    op.drop_table("sms_consents")
    op.drop_constraint("uq_sms_messages_twilio_message_sid", "sms_messages", type_="unique")
    op.drop_index("uq_appointments_business_active_slot", table_name="appointments")
    op.drop_column("appointments", "customer_confirmed_at")
    op.drop_column("appointments", "actual_revenue")
    op.drop_column("appointments", "booking_source")
    op.drop_column("call_log", "action_taken")
    op.drop_column("call_log", "ai_summary")
    op.drop_column("leads", "crm_synced_at")
    op.drop_column("leads", "actual_revenue")
    op.drop_column("leads", "next_follow_up_at")
    op.drop_column("leads", "last_contacted_at")
    op.drop_column("leads", "consent_updated_at")
    op.drop_column("leads", "consent_status")
    op.drop_column("leads", "caller_address")
    op.drop_column("businesses", "crm_webhook_url")
    op.drop_column("businesses", "review_request_delay_hours")
    op.drop_column("businesses", "review_request_enabled")
    op.drop_column("businesses", "minimum_notice_minutes")
    op.drop_column("businesses", "appointment_slot_minutes")
    op.drop_column("businesses", "auto_booking_enabled")
    op.drop_column("businesses", "call_transfer_number")
    op.drop_column("businesses", "faqs")
    op.drop_column("businesses", "service_area_zip_codes")
