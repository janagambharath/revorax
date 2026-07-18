"""Durable workflow primitives for CRM delivery, follow-ups, and SMS consent.

Webhook handlers should only persist a fact and enqueue work.  This module
provides the small database outbox used by the Railway worker so a Twilio retry
does not repeat an expensive action in the HTTP request lifecycle.
"""

from __future__ import annotations

import hashlib
import hmac
import ipaddress
import json
import logging
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.models import AutomationJob, Business, Lead, SMSConsent


logger = logging.getLogger(__name__)
settings = get_settings()

STOP_KEYWORDS = {"stop", "stopall", "unsubscribe", "cancel", "end", "quit"}
START_KEYWORDS = {"start", "unstop", "yes"}
HELP_KEYWORDS = {"help", "info"}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def normalize_phone(phone_number: str) -> str:
    """Keep the stored value stable enough for a tenant-scoped lookup."""
    return "".join(character for character in phone_number if character.isdigit() or character == "+")


def is_safe_crm_webhook_url(value: str | None) -> bool:
    """Allow only operator-approved CRM hosts; syntax checks alone are not SSRF protection."""
    if not value:
        return False
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        return False
    hostname = parsed.hostname.lower()
    if hostname in {"localhost", "localhost.localdomain"} or hostname.endswith(".local"):
        return False
    try:
        ipaddress.ip_address(hostname)
    except ValueError:
        allowed_hosts = {
            configured.strip().lower().rstrip(".")
            for configured in settings.CRM_WEBHOOK_ALLOWED_HOSTS
            if isinstance(configured, str) and configured.strip()
        }
        return hostname.rstrip(".") in allowed_hosts
    # Never allow IP-literal destinations. Exact DNS allowlisting lets an
    # operator approve an integration without tenant URLs reaching internal
    # or cloud-metadata addresses through DNS rebinding.
    return False


async def enqueue_job(
    db: AsyncSession,
    *,
    business_id: UUID,
    kind: str,
    idempotency_key: str,
    payload: dict[str, Any] | None = None,
    lead_id: UUID | None = None,
    run_at: datetime | None = None,
    max_attempts: int = 5,
) -> tuple[AutomationJob, bool]:
    """Create one durable job, returning the existing job on webhook retry."""
    existing_result = await db.execute(
        select(AutomationJob).where(AutomationJob.idempotency_key == idempotency_key)
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        return existing, False

    job = AutomationJob(
        business_id=business_id,
        lead_id=lead_id,
        kind=kind[:100],
        idempotency_key=idempotency_key[:255],
        payload=payload or {},
        run_at=run_at or utcnow(),
        max_attempts=max(1, min(max_attempts, 10)),
    )
    try:
        # A savepoint lets a duplicate unique-key race recover without rolling
        # back other changes made by the webhook or dashboard request.
        async with db.begin_nested():
            db.add(job)
            await db.flush()
        return job, True
    except IntegrityError:
        result = await db.execute(
            select(AutomationJob).where(AutomationJob.idempotency_key == idempotency_key)
        )
        duplicate = result.scalar_one_or_none()
        if duplicate:
            return duplicate, False
        raise


async def get_sms_consent(
    db: AsyncSession,
    business_id: UUID,
    phone_number: str,
) -> SMSConsent | None:
    result = await db.execute(
        select(SMSConsent).where(
            SMSConsent.business_id == business_id,
            SMSConsent.phone_number == normalize_phone(phone_number),
        )
    )
    return result.scalar_one_or_none()


async def record_sms_consent(
    db: AsyncSession,
    *,
    business_id: UUID,
    phone_number: str,
    consent_status: str,
    source: str,
    evidence: str | None = None,
    keyword: str | None = None,
) -> SMSConsent:
    """Persist a customer messaging choice before any automated reply."""
    normalized_phone = normalize_phone(phone_number)
    consent = await get_sms_consent(db, business_id, normalized_phone)
    now = utcnow()
    created = False
    if consent is None:
        candidate = SMSConsent(
            business_id=business_id,
            phone_number=normalized_phone,
            status=consent_status,
            source=source[:100],
            evidence=(evidence or "")[:2000] or None,
            last_keyword=(keyword or "")[:20] or None,
        )
        try:
            # Two inbound Twilio callbacks for the same number can arrive at
            # once.  The ledger's unique key is the source of truth; recover
            # the winner instead of failing the webhook transaction.
            async with db.begin_nested():
                db.add(candidate)
                await db.flush()
            consent = candidate
            created = True
        except IntegrityError:
            consent = await get_sms_consent(db, business_id, normalized_phone)
            if consent is None:
                raise

    if not created:
        # A generic inbound message must never silently reverse a recorded
        # carrier STOP. Only the explicit START/UNSTOP/YES branch below can
        # restore messaging permission.
        if consent.status == "opted_out" and consent_status == "conversational":
            consent.last_keyword = (keyword or "")[:20] or consent.last_keyword
            await db.flush()
            return consent
        consent.status = consent_status
        consent.source = source[:100]
        consent.evidence = (evidence or "")[:2000] or consent.evidence
        consent.last_keyword = (keyword or "")[:20] or consent.last_keyword

    if consent_status == "opted_out":
        consent.opted_out_at = now
    elif consent_status in {"opted_in", "conversational"}:
        consent.opted_in_at = consent.opted_in_at or now
        if consent_status == "opted_in":
            consent.opted_out_at = None

    await db.flush()
    return consent


async def record_inbound_keyword(
    db: AsyncSession,
    *,
    business_id: UUID,
    phone_number: str,
    body: str,
) -> tuple[str, SMSConsent]:
    """Handle carrier opt-out/opt-in keywords before invoking any AI."""
    keyword = (body or "").strip().lower()
    if keyword in STOP_KEYWORDS:
        consent = await record_sms_consent(
            db,
            business_id=business_id,
            phone_number=phone_number,
            consent_status="opted_out",
            source="inbound_sms_keyword",
            evidence=body,
            keyword=keyword,
        )
        return "stop", consent
    if keyword in START_KEYWORDS:
        consent = await record_sms_consent(
            db,
            business_id=business_id,
            phone_number=phone_number,
            consent_status="opted_in",
            source="inbound_sms_keyword",
            evidence=body,
            keyword=keyword,
        )
        return "start", consent
    if keyword in HELP_KEYWORDS:
        consent = await record_sms_consent(
            db,
            business_id=business_id,
            phone_number=phone_number,
            consent_status="conversational",
            source="inbound_sms",
            evidence=body,
            keyword=keyword,
        )
        return "help", consent
    consent = await record_sms_consent(
        db,
        business_id=business_id,
        phone_number=phone_number,
        consent_status="conversational",
        source="inbound_sms",
        evidence=body,
    )
    return "message", consent


def can_send_automated_sms(
    consent: SMSConsent | None,
    *,
    purpose: str = "conversation",
) -> bool:
    """Gate messaging by the recorded consent purpose, not a UI checkbox."""
    if consent is None or consent.status == "opted_out":
        return False
    if purpose == "manual":
        # A signed-in business owner may send a customer-service reply, but
        # the carrier opt-out ledger remains absolute.
        return True
    if purpose in {"review", "marketing"}:
        return consent.status == "opted_in"
    return consent.status in {"conversational", "opted_in"} and settings.ENABLE_SMS_AUTOMATION


def build_crm_event(
    *,
    event_type: str,
    business: Business,
    lead: Lead | None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create a documented, provider-neutral CRM webhook payload."""
    return {
        "event": event_type,
        "occurred_at": utcnow().isoformat(),
        "business": {"id": str(business.id), "name": business.name},
        "lead": (
            {
                "id": str(lead.id),
                "name": lead.caller_name,
                "phone": lead.caller_phone,
                "address": lead.caller_address,
                "zip_code": lead.zip_code,
                "service_type": lead.service_type,
                "urgency": str(lead.urgency.value if hasattr(lead.urgency, "value") else lead.urgency),
                "status": str(lead.status.value if hasattr(lead.status, "value") else lead.status),
                "estimated_value": lead.estimated_value,
                "actual_revenue": lead.actual_revenue,
                "summary": lead.ai_summary,
            }
            if lead
            else None
        ),
        "metadata": metadata or {},
    }


async def deliver_crm_event(
    business: Business,
    event: dict[str, Any],
) -> bool:
    """POST a signed CRM event to a prevalidated tenant endpoint."""
    if not business.crm_webhook_url:
        logger.info("CRM sync skipped for %s: no connector configured", business.id)
        return False
    if not is_safe_crm_webhook_url(business.crm_webhook_url):
        raise ValueError("CRM webhook URL is not an allowed public HTTPS endpoint")
    if not settings.CRM_WEBHOOK_SIGNING_SECRET:
        raise ValueError("CRM webhook signing secret is required before CRM delivery")

    serialized = json.dumps(event, separators=(",", ":"), sort_keys=True, default=str)
    headers = {"Content-Type": "application/json", "User-Agent": "Revorax-CRM/1.0"}
    signature = hmac.new(
        settings.CRM_WEBHOOK_SIGNING_SECRET.encode(),
        serialized.encode(),
        hashlib.sha256,
    ).hexdigest()
    headers["X-Revorax-Signature"] = f"sha256={signature}"

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
        response = await client.post(business.crm_webhook_url, content=serialized, headers=headers)
        response.raise_for_status()
    return True
