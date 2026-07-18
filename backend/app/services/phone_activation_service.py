"""Operator-only activation of an existing Twilio number for one tenant."""

from __future__ import annotations

import asyncio

from app.core.config import get_settings
from app.services.twilio_service import get_twilio_client


settings = get_settings()


async def attach_existing_twilio_number(phone_number: str) -> dict[str, str]:
    """Verify a number belongs to this Twilio account and set Revorax callbacks.

    This is intentionally separate from public signup: an authenticated
    customer cannot discover or attach another tenant's number from the shared
    Twilio account. An operator must call the protected activation route.
    """
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        raise ValueError("Twilio credentials are not configured")

    client = get_twilio_client()

    def find_and_configure():
        matches = client.incoming_phone_numbers.list(phone_number=phone_number, limit=2)
        if len(matches) != 1:
            raise ValueError("The phone number is not uniquely owned by this Twilio account")
        current = matches[0]
        configured = client.incoming_phone_numbers(current.sid).update(
            voice_url=f"{settings.BACKEND_URL.rstrip('/')}/api/v1/webhooks/twilio/voice",
            voice_method="POST",
            sms_url=f"{settings.BACKEND_URL.rstrip('/')}/api/v1/webhooks/twilio/sms",
            sms_method="POST",
            status_callback=f"{settings.BACKEND_URL.rstrip('/')}/api/v1/webhooks/twilio/status",
            status_callback_method="POST",
        )
        return {"phone_number": configured.phone_number, "sid": configured.sid}

    return await asyncio.to_thread(find_and_configure)
