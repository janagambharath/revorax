"""
AI service — handles LLM-based lead qualification and STT transcription.

Two jobs:
1. Transcribe voicemails (Groq Whisper)
2. Qualify leads from transcripts/SMS (OpenRouter LLM)

Voicemail and SMS work may run asynchronously. Live-call analysis is separately
bounded so the Twilio request path still has a safe deterministic fallback.
"""

import asyncio
import json
import logging
import re
from datetime import date

import httpx
from openai import AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Groq Whisper (Speech-to-Text) ────────────────────────

groq_client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url=settings.GROQ_BASE_URL,
)

# ── OpenRouter (LLM) ────────────────────────────────────

openrouter_client = AsyncOpenAI(
    api_key=settings.OPENROUTER_API_KEY,
    base_url=settings.OPENROUTER_BASE_URL,
)


async def transcribe_audio(audio_url: str) -> str | None:
    """
    Download a Twilio recording and transcribe it via Groq Whisper.

    Returns the transcription text or None on failure.
    """
    try:
        # Download the audio file from Twilio
        async with httpx.AsyncClient() as client:
            response = await client.get(
                audio_url,
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                follow_redirects=True,
            )
            response.raise_for_status()
            audio_data = response.content

        # Send to Groq Whisper for transcription
        transcription = await groq_client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=("recording.wav", audio_data, "audio/wav"),
            language="en",
        )

        logger.info(f"Transcription complete: {len(transcription.text)} chars")
        return transcription.text

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return None


async def qualify_lead(
    transcript: str | None = None,
    sms_conversation: str | None = None,
    business_services: list[str] | None = None,
) -> dict:
    """
    Use LLM to extract structured lead data from a voicemail transcript
    or SMS conversation.

    Returns a dict with:
    - caller_name: str or null
    - address: str or null
    - service_type: str or null
    - urgency: "emergency" | "soon" | "flexible" | "unknown"
    - zip_code: str or null
    - preferred_time: str or null
    - summary: str (1-2 sentence summary for the owner)
    """
    services_list = ", ".join(business_services) if business_services else "HVAC services"

    context = ""
    if transcript:
        context = f"Voicemail transcript:\n{transcript}"
    elif sms_conversation:
        context = f"SMS conversation:\n{sms_conversation}"
    else:
        return {
            "caller_name": None,
            "address": None,
            "service_type": None,
            "urgency": "unknown",
            "zip_code": None,
            "preferred_time": None,
            "summary": "No content to qualify.",
        }

    prompt = f"""You are a lead qualification assistant for an HVAC company.
The company offers these services: {services_list}.

Analyze the following and extract structured information:

{context}

Return a JSON object with exactly these fields:
- "caller_name": the caller's name if mentioned, otherwise null
- "address": their full service address if mentioned, otherwise null
- "service_type": the specific service they need (e.g., "AC Repair", "Furnace Installation", "Maintenance"), or null if unclear
- "urgency": one of "emergency" (system broken, no heat/AC, safety issue), "soon" (wants service within a few days), "flexible" (general inquiry, scheduling ahead), or "unknown"
- "zip_code": their ZIP code if mentioned, otherwise null
- "preferred_time": when they want service if mentioned (e.g., "tomorrow morning", "this weekend"), otherwise null
- "summary": a brief 1-2 sentence summary for the business owner describing what this lead needs

Respond ONLY with the JSON object. No markdown, no explanation."""

    try:
        response = await openrouter_client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": "You extract structured data from customer communications. Respond only with valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=500,
        )

        content = response.choices[0].message.content.strip()

        # Clean up potential markdown wrapping
        if content.startswith("```"):
            content = content.split("\n", 1)[1]  # Remove first line
            content = content.rsplit("```", 1)[0]  # Remove last ```
            content = content.strip()

        result = json.loads(content)
        logger.info(f"Lead qualified: {result.get('summary', 'N/A')}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        return {
            "caller_name": None,
            "address": None,
            "service_type": None,
            "urgency": "unknown",
            "zip_code": None,
            "preferred_time": None,
            "summary": f"Auto-qualification failed. Raw transcript: {transcript or sms_conversation or 'N/A'}",
        }
    except Exception as e:
        logger.error(f"Lead qualification failed: {e}")
        return {
            "caller_name": None,
            "address": None,
            "service_type": None,
            "urgency": "unknown",
            "zip_code": None,
            "preferred_time": None,
            "summary": f"Auto-qualification failed: {str(e)}",
        }


async def generate_sms_reply(
    conversation_history: str,
    business_name: str,
    business_services: list[str] | None = None,
) -> str:
    """
    Generate an AI-powered SMS reply for lead qualification.

    The AI acts as a friendly receptionist, collecting:
    - What service they need
    - How urgent it is
    - Their preferred time
    - Their service address and ZIP code (for service area confirmation)
    """
    services_list = ", ".join(business_services) if business_services else "HVAC services"

    prompt = f"""You are a friendly, professional text receptionist for {business_name}, an HVAC company.
You're texting with a potential customer. Your goal is to:
1. Understand what service they need ({services_list})
2. Determine urgency (is their system broken? or is this a routine request?)
3. Find out when they'd like service
4. Confirm their service address and ZIP code for service area
5. Let them know someone will follow up to confirm the appointment

Rules:
- Be warm and professional, not robotic
- Keep messages SHORT (under 160 characters when possible)
- Don't ask more than one question at a time
- If they've provided enough info, thank them and say someone will confirm shortly
- Never make promises about pricing
- If it's an emergency (no heat in winter, no AC in summer, gas smell), express urgency and say a technician will call them ASAP

Conversation so far:
{conversation_history}

Write the next reply. Just the message text, nothing else."""

    try:
        response = await openrouter_client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": "You are a text-based receptionist. Reply with just the SMS message text."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=200,
        )

        reply = response.choices[0].message.content.strip()

        # Strip any quotes the model might add
        if reply.startswith('"') and reply.endswith('"'):
            reply = reply[1:-1]

        return reply

    except Exception as e:
        logger.error(f"SMS reply generation failed: {e}")
        return (
            f"Thanks for reaching out to {business_name}! "
            f"Someone from our team will get back to you shortly."
        )


# ── Live Call Analysis ────────────────────────────────────────────────────

# A live phone call has a much shorter response budget than voicemail or SMS.
# Keep the schema intentionally small and validate every model value before it
# controls a Twilio action.  This also gives callers a useful path when the LLM
# key is absent or the provider is temporarily slow.
LIVE_CALL_INTENTS = {
    "book",
    "transfer",
    "callback",
    "sms",
    "faq",
    "service_request",
    "unknown",
}
LIVE_CALL_URGENCIES = {"emergency", "soon", "flexible", "unknown"}
LIVE_CALL_FAQ_TOPICS = {"hours", "services", "location", "general", "unknown"}
LIVE_CALL_EXPECTED_FIELDS = {
    "caller_name",
    "address",
    "service_type",
    "urgency",
    "requested_date",
    "requested_time",
}


def _clean_live_call_text(value: object, max_length: int = 500) -> str | None:
    """Return a compact, bounded string or None for untrusted model output."""
    if not isinstance(value, str):
        return None
    value = " ".join(value.split()).strip()
    return value[:max_length] if value else None


def _normalise_requested_date(value: object) -> str | None:
    value = _clean_live_call_text(value, max_length=10)
    if not value:
        return None
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        return None


def _normalise_requested_time(value: object) -> str | None:
    value = _clean_live_call_text(value, max_length=20)
    if not value:
        return None

    twenty_four_hour = re.fullmatch(r"([01]?\d|2[0-3]):([0-5]\d)", value)
    if twenty_four_hour:
        return f"{int(twenty_four_hour.group(1)):02d}:{twenty_four_hour.group(2)}"

    twelve_hour = re.fullmatch(
        r"(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*([AaPp])\.?[Mm]\.?",
        value,
    )
    if not twelve_hour:
        return None

    hour = int(twelve_hour.group(1))
    minute = int(twelve_hour.group(2) or "0")
    meridiem = twelve_hour.group(3).lower()
    if meridiem == "p" and hour != 12:
        hour += 12
    elif meridiem == "a" and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute:02d}"


def _match_offered_service(
    speech: str, business_services: list[str] | None
) -> str | None:
    """Match only configured services, so the fallback never invents one."""
    if not business_services:
        return None

    normalised_speech = re.sub(r"[^a-z0-9]+", " ", speech.lower()).strip()
    for service in business_services:
        if not isinstance(service, str):
            continue
        normalised_service = re.sub(r"[^a-z0-9]+", " ", service.lower()).strip()
        if normalised_service and normalised_service in normalised_speech:
            return service.strip()[:255]
    return None


def _fallback_live_call_analysis(
    speech: str,
    business_services: list[str] | None,
    expected_field: str | None = None,
) -> dict:
    """Deterministic, offline-safe routing for a live call."""
    text = _clean_live_call_text(speech) or ""
    lower = text.lower()

    hours_question = bool(
        re.search(r"\b(?:what|when|are|do|can|could|tell me)\b.{0,45}\b(hours?|open|close)\b", lower)
    )
    services_question = bool(
        re.search(r"\b(?:what|which|do|can|could|tell me)\b.{0,45}\b(services?|offer)\b", lower)
    )
    location_question = bool(
        re.search(r"\b(?:where|what(?:'s| is) your|tell me your)\b.{0,45}\b(location|address|located)\b", lower)
    )
    is_faq_question = (
        expected_field != "address"
        and (hours_question or services_question or location_question)
    )

    intent = "service_request"
    if re.search(r"\b(book|booking|schedule|appointment)\b", lower):
        intent = "book"
    elif re.search(r"\b(human|person|representative|operator|agent|transfer)\b", lower):
        intent = "transfer"
    elif re.search(r"\b(call(?:\s+me)?\s+back|callback)\b", lower):
        intent = "callback"
    elif re.search(r"\b(text|sms|message)\s+(?:me|us)\b", lower):
        intent = "sms"
    elif is_faq_question:
        intent = "faq"

    urgency = "unknown"
    if re.search(
        r"\b(gas smell|carbon monoxide|smoke|fire|sparking|flood|leak|no heat|no heating|no ac|no air conditioning|emergency|urgent)\b",
        lower,
    ):
        urgency = "emergency"
    elif re.search(r"\b(today|tonight|asap|soon|this afternoon|this morning)\b", lower):
        urgency = "soon"
    elif re.search(r"\b(next week|maintenance|tune[- ]?up|estimate|quote|whenever)\b", lower):
        urgency = "flexible"

    faq_topic = "unknown"
    if hours_question:
        faq_topic = "hours"
    elif services_question:
        faq_topic = "services"
    elif location_question:
        faq_topic = "location"
    elif intent == "faq":
        faq_topic = "general"

    name_match = re.search(
        r"\b(?:my name is|this is|i am|i'm)\s+([A-Za-z][A-Za-z' -]{1,59})",
        text,
        flags=re.IGNORECASE,
    )
    caller_name = _clean_live_call_text(name_match.group(1), 255) if name_match else None
    zip_match = re.search(r"\b\d{5}(?:-\d{4})?\b", text)

    requested_date = None
    iso_date_match = re.search(r"\b\d{4}-\d{2}-\d{2}\b", text)
    if iso_date_match:
        requested_date = _normalise_requested_date(iso_date_match.group(0))
    else:
        us_date_match = re.search(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", text)
        if us_date_match:
            try:
                requested_date = date(
                    int(us_date_match.group(3)),
                    int(us_date_match.group(1)),
                    int(us_date_match.group(2)),
                ).isoformat()
            except ValueError:
                requested_date = None

    time_match = re.search(
        r"\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*([AaPp])\.?[Mm]\.?\b",
        text,
    )
    requested_time = _normalise_requested_time(time_match.group(0)) if time_match else None

    result = {
        "intent": intent,
        "caller_name": caller_name,
        "service_type": _match_offered_service(text, business_services),
        "urgency": urgency,
        "zip_code": zip_match.group(0) if zip_match else None,
        "address": None,
        "preferred_time": _clean_live_call_text(text, 255) if requested_time else None,
        "requested_date": requested_date,
        "requested_time": requested_time,
        "faq_topic": faq_topic,
        "summary": f"Live call: {text[:300]}" if text else "Live call awaiting caller input.",
    }

    # The route tells us which one answer it just asked for.  This lets the
    # deterministic path safely collect a name or address even when no LLM is
    # configured.
    if expected_field == "caller_name" and not result["caller_name"]:
        candidate = re.sub(r"^(?:my name is|this is|i am|i'm)\s+", "", text, flags=re.I)
        if re.fullmatch(r"[A-Za-z][A-Za-z' -]{1,59}", candidate or ""):
            result["caller_name"] = candidate.strip()
    elif expected_field == "address" and len(text) >= 5:
        result["address"] = text[:500]
    elif expected_field == "service_type" and not result["service_type"]:
        # Keep the caller's stated service for a human follow-up.  The route
        # independently checks it against the configured service list before
        # it ever promises a booking or transfer.
        result["service_type"] = _clean_live_call_text(text, 255)
    elif expected_field == "urgency" and urgency == "unknown":
        if re.search(r"\b(not urgent|routine|maintenance|flexible)\b", lower):
            result["urgency"] = "flexible"
    elif expected_field == "requested_date":
        result["requested_date"] = requested_date
    elif expected_field == "requested_time":
        result["requested_time"] = requested_time

    return result


def _normalise_live_call_analysis(
    candidate: object,
    fallback: dict,
) -> dict:
    """Merge untrusted LLM JSON with the deterministic fallback."""
    if not isinstance(candidate, dict):
        return fallback

    result = dict(fallback)
    intent = candidate.get("intent")
    if intent in LIVE_CALL_INTENTS:
        result["intent"] = intent

    urgency = candidate.get("urgency")
    if urgency in LIVE_CALL_URGENCIES:
        result["urgency"] = urgency

    faq_topic = candidate.get("faq_topic")
    if faq_topic in LIVE_CALL_FAQ_TOPICS:
        result["faq_topic"] = faq_topic

    for key, max_length in {
        "caller_name": 255,
        "service_type": 255,
        "zip_code": 10,
        "address": 500,
        "preferred_time": 255,
        "summary": 500,
    }.items():
        cleaned = _clean_live_call_text(candidate.get(key), max_length)
        if cleaned:
            result[key] = cleaned

    requested_date = _normalise_requested_date(candidate.get("requested_date"))
    if requested_date:
        result["requested_date"] = requested_date

    requested_time = _normalise_requested_time(candidate.get("requested_time"))
    if requested_time:
        result["requested_time"] = requested_time

    return result


async def analyze_live_call(
    speech: str,
    business_services: list[str] | None = None,
    expected_field: str | None = None,
) -> dict:
    """Classify a live caller with a bounded LLM request and safe fallback.

    This is deliberately separate from ``qualify_lead``: Twilio needs TwiML
    promptly, and a provider outage must still result in a deterministic
    callback or FAQ response rather than a failed call.
    """
    expected_field = expected_field if expected_field in LIVE_CALL_EXPECTED_FIELDS else None
    fallback = _fallback_live_call_analysis(speech, business_services, expected_field)

    if not speech.strip() or not settings.OPENROUTER_API_KEY:
        return fallback

    services_list = ", ".join(
        service for service in (business_services or []) if isinstance(service, str)
    ) or "No services are configured"
    expected_instruction = (
        f"The caller is answering a request for their {expected_field}. "
        if expected_field
        else ""
    )
    prompt = f"""You are a live phone receptionist for an HVAC business. {expected_instruction}
Today's date is {date.today().isoformat()}.
Configured services: {services_list}

Analyze this caller speech:
{speech}

Return only a JSON object with exactly these fields:
- intent: one of book, transfer, callback, sms, faq, service_request, unknown
- caller_name: string or null
- service_type: configured service name if clear, otherwise null
- urgency: emergency, soon, flexible, or unknown
- zip_code: string or null
- address: string or null
- preferred_time: string or null
- requested_date: ISO YYYY-MM-DD or null; only give a date when explicit or unambiguous
- requested_time: 24-hour HH:MM or null; only give a time when explicit
- faq_topic: hours, services, location, general, or unknown
- summary: one concise sentence for the business

Never invent availability, pricing, service coverage, or appointment confirmation."""

    try:
        response = await asyncio.wait_for(
            openrouter_client.chat.completions.create(
                model=settings.OPENROUTER_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Return valid JSON only. Route live callers safely and conservatively.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0,
                max_tokens=350,
            ),
            timeout=4.5,
        )
        content = (response.choices[0].message.content or "").strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else ""
            content = content.rsplit("```", 1)[0].strip()
        return _normalise_live_call_analysis(json.loads(content), fallback)
    except (asyncio.TimeoutError, json.JSONDecodeError, KeyError, IndexError, TypeError) as exc:
        logger.warning("Live-call AI unavailable; using deterministic routing: %s", exc)
        return fallback
    except Exception as exc:
        logger.warning("Live-call AI request failed; using deterministic routing: %s", exc)
        return fallback
