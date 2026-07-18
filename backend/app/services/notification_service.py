"""
Notification service — alerts the business owner when a new lead comes in.

Two channels:
1. SMS (via Twilio) — instant, high visibility
2. Email (via Resend) — detailed, with lead info

Speed matters. HVAC owners need to know about leads immediately.
"""

import html
import logging

import resend

from app.core.config import get_settings
from app.services.twilio_service import send_sms

logger = logging.getLogger(__name__)
settings = get_settings()


async def notify_owner_sms(
    owner_phone: str,
    business_twilio_number: str,
    lead_name: str | None,
    lead_phone: str,
    service_type: str | None,
    urgency: str,
    summary: str,
) -> bool:
    """Send the owner an SMS notification about a new lead."""
    urgency_emoji = {
        "emergency": "🚨",
        "soon": "⚡",
        "flexible": "📋",
        "unknown": "📞",
    }.get(urgency, "📞")

    name_str = lead_name or "Unknown"
    service_str = service_type or "Not specified"

    body = (
        f"{urgency_emoji} NEW LEAD\n"
        f"Name: {name_str}\n"
        f"Phone: {lead_phone}\n"
        f"Service: {service_str}\n"
        f"Urgency: {urgency}\n"
        f"{summary}"
    )

    message_sid = await send_sms(
        to=owner_phone,
        from_=business_twilio_number,
        body=body,
    )
    if not message_sid:
        logger.warning("Owner SMS notification was not accepted by Twilio")
        return False
    return True


async def notify_owner_email(
    owner_email: str,
    owner_name: str,
    business_name: str,
    lead_name: str | None,
    lead_phone: str,
    service_type: str | None,
    urgency: str,
    summary: str,
    transcript: str | None = None,
) -> bool:
    """Send the owner an email notification about a new lead."""
    if not settings.RESEND_API_KEY:
        logger.warning("Resend API key not configured, skipping email notification")
        return False

    resend.api_key = settings.RESEND_API_KEY

    urgency_color = {
        "emergency": "#DC2626",
        "soon": "#F59E0B",
        "flexible": "#3B82F6",
        "unknown": "#6B7280",
    }.get(urgency, "#6B7280")

    name_str = lead_name or "Unknown Caller"
    service_str = service_type or "Not specified"
    safe_business_name = html.escape(business_name)
    safe_name = html.escape(name_str)
    safe_service = html.escape(service_str)
    safe_phone = html.escape(lead_phone)
    safe_summary = html.escape(summary)
    safe_subject_name = " ".join(name_str.replace("\r", " ").replace("\n", " ").split())[:120]
    safe_subject_service = " ".join(service_str.replace("\r", " ").replace("\n", " ").split())[:120]
    transcript_section = ""
    if transcript:
        transcript_section = f"""
        <div style="margin-top: 16px; padding: 12px; background: #F3F4F6; border-radius: 8px;">
            <strong>Voicemail Transcript:</strong>
            <p style="margin: 8px 0 0; color: #374151;">{html.escape(transcript)}</p>
        </div>
        """

    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #1E293B; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">🔔 New Lead for {safe_business_name}</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="display: inline-block; padding: 4px 12px; background: {urgency_color}; color: white; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                {urgency}
            </div>
            <table style="width: 100%; margin-top: 16px; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Name</td>
                    <td style="padding: 8px 0; font-weight: 600;">{safe_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Phone</td>
                    <td style="padding: 8px 0; font-weight: 600;">
                        <a href="tel:{safe_phone}" style="color: #2563EB; text-decoration: none;">{safe_phone}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Service</td>
                    <td style="padding: 8px 0; font-weight: 600;">{safe_service}</td>
                </tr>
            </table>
            <div style="margin-top: 16px; padding: 12px; background: #EFF6FF; border-radius: 8px; border-left: 3px solid #2563EB;">
                <strong>Summary:</strong> {safe_summary}
            </div>
            {transcript_section}
            <div style="margin-top: 20px; text-align: center;">
                <a href="tel:{safe_phone}" style="display: inline-block; padding: 12px 24px; background: #2563EB; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    📞 Call {safe_name} Back
                </a>
            </div>
        </div>
    </div>
    """

    try:
        resend.Emails.send(
            {
                "from": settings.FROM_EMAIL,
                "to": [owner_email],
                "subject": f"🔔 New {urgency.upper()} lead: {safe_subject_name} — {safe_subject_service}",
                "html": html,
            }
        )
        logger.info(f"Email notification sent to {owner_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
        return False
