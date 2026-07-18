"""
AI service — handles LLM-based lead qualification and STT transcription.

Two jobs:
1. Transcribe voicemails (Groq Whisper)
2. Qualify leads from transcripts/SMS (OpenRouter LLM)

Both are called from background workers, never from the request path.
"""

import logging
import json

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
    - Their ZIP code (for service area confirmation)
    """
    services_list = ", ".join(business_services) if business_services else "HVAC services"

    prompt = f"""You are a friendly, professional text receptionist for {business_name}, an HVAC company.
You're texting with a potential customer. Your goal is to:
1. Understand what service they need ({services_list})
2. Determine urgency (is their system broken? or is this a routine request?)
3. Find out when they'd like service
4. Confirm their ZIP code for service area
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
