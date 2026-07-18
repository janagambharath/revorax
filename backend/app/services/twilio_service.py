"""
Twilio service — handles all Voice and SMS interactions.

This is the revenue engine. Every function here directly contributes
to capturing leads and recovering missed calls.
"""

import logging
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from twilio.twiml.messaging_response import MessagingResponse

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_twilio_client() -> Client:
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


# ── Phone Number Management ──────────────────────────────


async def provision_phone_number(area_code: str = "512") -> dict:
    """
    Buy a Twilio phone number for a new business.
    Returns {"phone_number": "+1...", "sid": "PN..."}
    """
    client = get_twilio_client()
    try:
        # Search for available numbers
        available = client.available_phone_numbers("US").local.list(
            area_code=area_code, voice_enabled=True, sms_enabled=True, limit=1
        )
        if not available:
            # Fallback: any US number
            available = client.available_phone_numbers("US").local.list(
                voice_enabled=True, sms_enabled=True, limit=1
            )

        if not available:
            raise Exception("No phone numbers available")

        # Purchase the number
        number = client.incoming_phone_numbers.create(
            phone_number=available[0].phone_number,
            voice_url=f"{settings.BACKEND_URL}/api/v1/webhooks/twilio/voice",
            voice_method="POST",
            sms_url=f"{settings.BACKEND_URL}/api/v1/webhooks/twilio/sms",
            sms_method="POST",
            status_callback=f"{settings.BACKEND_URL}/api/v1/webhooks/twilio/status",
            status_callback_method="POST",
        )

        logger.info(f"Provisioned Twilio number: {number.phone_number}")
        return {
            "phone_number": number.phone_number,
            "sid": number.sid,
        }

    except Exception as e:
        logger.error(f"Failed to provision phone number: {e}")
        raise


# ── Voice (Inbound Call Handling) ────────────────────────


def generate_voicemail_twiml(
    greeting: str | None = None,
    recording_callback_url: str | None = None,
) -> str:
    """
    Generate TwiML for voicemail capture.
    
    The call flow:
    1. Play greeting
    2. Record the voicemail (max 120 seconds)
    3. POST recording to our webhook for transcription
    """
    response = VoiceResponse()

    greeting_text = greeting or (
        "Thank you for calling. We're currently unavailable but your call "
        "is very important to us. Please leave a message with your name, "
        "phone number, and a brief description of what you need help with, "
        "and we'll get back to you as soon as possible."
    )

    response.say(greeting_text, voice="Polly.Matthew", language="en-US")

    response.record(
        max_length=120,
        action=recording_callback_url or f"{settings.BACKEND_URL}/api/v1/webhooks/twilio/recording-complete",
        recording_status_callback=f"{settings.BACKEND_URL}/api/v1/webhooks/twilio/recording-status",
        recording_status_callback_method="POST",
        transcribe=False,  # We use Groq Whisper instead
        play_beep=True,
    )

    # If they don't leave a message, hang up gracefully
    response.say("We didn't receive a message. Goodbye.")

    return str(response)


def generate_missed_call_twiml() -> str:
    """
    TwiML for when we detect a missed call (short ring, no answer).
    Just ends the call — the auto-text is sent via a background job.
    """
    response = VoiceResponse()
    response.hangup()
    return str(response)


# ── SMS ──────────────────────────────────────────────────


async def send_sms(to: str, from_: str, body: str) -> str | None:
    """
    Send an SMS via Twilio.
    Returns the message SID or None on failure.
    """
    client = get_twilio_client()
    try:
        message = client.messages.create(
            to=to,
            from_=from_,
            body=body,
        )
        logger.info(f"SMS sent to {to}: {message.sid}")
        return message.sid
    except Exception as e:
        logger.error(f"Failed to send SMS to {to}: {e}")
        return None


async def send_missed_call_text(
    to: str,
    from_: str,
    business_name: str,
) -> str | None:
    """
    Auto-text a caller who we missed. This is the #1 revenue recovery feature.
    Must go out within 60 seconds of the missed call.
    """
    body = (
        f"Hi! This is {business_name}. We noticed we missed your call. "
        f"How can we help you today? Reply with a brief description and "
        f"we'll get you taken care of right away."
    )
    return await send_sms(to=to, from_=from_, body=body)
