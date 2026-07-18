"""Deterministic business rules used before Revorax takes customer action.

The assistant may help understand a caller, but it must never invent a service
area, opening time, availability, or appointment.  This module keeps those
decisions local, testable, and independent of an LLM provider.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone, tzinfo
from typing import Iterable
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.models.models import AppointmentStatus, Business


DAY_KEYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")


@dataclass(frozen=True)
class BusinessRuleResult:
    """The explicit outcome of checking a proposed customer action."""

    within_business_hours: bool | None
    in_service_area: bool | None
    service_supported: bool | None
    can_auto_book: bool
    reason: str | None = None


def business_timezone(business: Business) -> tzinfo:
    """Return a usable timezone even if a legacy tenant has a bad value."""
    try:
        return ZoneInfo(business.timezone or "America/New_York")
    except ZoneInfoNotFoundError:
        try:
            return ZoneInfo("America/New_York")
        except ZoneInfoNotFoundError:
            # ``tzdata`` is a runtime dependency, but UTC keeps the workflow
            # safe and operable even if a broken image omits its zoneinfo data.
            return timezone.utc


def normalize_zip_code(value: str | None) -> str | None:
    """Normalize a US ZIP(+4) to the five digit value used for rule checks."""
    if not isinstance(value, str):
        return None
    digits = "".join(character for character in value if character.isdigit())
    return digits[:5] if len(digits) >= 5 else None


def _normalize_day_key(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip().lower()[:3]
    return normalized if normalized in DAY_KEYS else None


def _parse_time(value: object) -> time | None:
    if not isinstance(value, str):
        return None
    try:
        return time.fromisoformat(value.strip())
    except ValueError:
        return None


def _hours_for_day(business: Business, local_day: date) -> tuple[time, time] | None:
    """Read one day of a business-hours JSON object without making guesses."""
    hours = business.business_hours
    if not isinstance(hours, dict):
        return None

    day_key = DAY_KEYS[local_day.weekday()]
    entry = hours.get(day_key)
    if entry is None:
        entry = hours.get(day_key.title()) or hours.get(day_key.capitalize())
    if entry is None:
        # Tolerate full day keys supplied by a dashboard user.
        full_name = local_day.strftime("%A").lower()
        entry = hours.get(full_name) or hours.get(full_name.title())
    if not isinstance(entry, dict):
        return None
    if entry.get("closed") is True:
        return None

    opens = _parse_time(entry.get("open"))
    closes = _parse_time(entry.get("close"))
    if not opens or not closes or opens >= closes:
        return None
    return opens, closes


def is_within_business_hours(
    business: Business, when: datetime | None = None
) -> bool | None:
    """Return None when the tenant has not configured usable hours yet."""
    local_now = (when or datetime.now(timezone.utc)).astimezone(business_timezone(business))
    hours = _hours_for_day(business, local_now.date())
    if hours is None:
        return None
    opens, closes = hours
    current = local_now.timetz().replace(tzinfo=None)
    return opens <= current < closes


def is_in_service_area(business: Business, zip_code: str | None) -> bool | None:
    """Check configured ZIP coverage; None means coverage is not configured."""
    configured = business.service_area_zip_codes
    if not isinstance(configured, list) or not configured:
        return None
    normalized = normalize_zip_code(zip_code)
    if not normalized:
        return False
    covered = {normalize_zip_code(str(item)) for item in configured}
    return normalized in covered


def is_service_supported(business: Business, service_type: str | None) -> bool | None:
    """Match configured services case-insensitively without widening scope."""
    configured = business.services_offered
    if not isinstance(configured, list) or not configured:
        return None
    if not isinstance(service_type, str) or not service_type.strip():
        return False
    wanted = " ".join(service_type.lower().split())
    available = {
        " ".join(str(item).lower().split())
        for item in configured
        if isinstance(item, str) and item.strip()
    }
    return wanted in available


def check_customer_request(
    business: Business,
    *,
    zip_code: str | None,
    service_type: str | None,
    when: datetime | None = None,
) -> BusinessRuleResult:
    """Evaluate whether the configured rules permit automatic booking.

    Missing configuration intentionally disables automatic booking.  The lead
    is still captured and a human can call back, which is safer than promising
    a visit the business cannot honor.
    """
    in_hours = is_within_business_hours(business, when)
    in_area = is_in_service_area(business, zip_code)
    supported = is_service_supported(business, service_type)

    if not business.auto_booking_enabled:
        return BusinessRuleResult(in_hours, in_area, supported, False, "Automatic booking is disabled.")
    if in_hours is not True:
        return BusinessRuleResult(in_hours, in_area, supported, False, "Business hours are unavailable or closed.")
    if in_area is not True:
        return BusinessRuleResult(in_hours, in_area, supported, False, "Service area is not confirmed.")
    if supported is not True:
        return BusinessRuleResult(in_hours, in_area, supported, False, "Requested service is not confirmed.")
    return BusinessRuleResult(in_hours, in_area, supported, True)


def _slot_is_available(
    slot: datetime,
    existing_slots: set[tuple[str, str]],
) -> bool:
    return (slot.date().isoformat(), slot.strftime("%H:%M")) not in existing_slots


def find_next_available_slot(
    business: Business,
    appointments: Iterable[object],
    *,
    requested_date: str | None = None,
    requested_time: str | None = None,
    now: datetime | None = None,
    horizon_days: int = 21,
) -> tuple[str, str] | None:
    """Find an unbooked single-dispatch slot from configured business hours.

    Appointments use date/time columns today, so this treats one appointment
    per business/slot as the available capacity.  It never silently chooses a
    slot when hours are absent or malformed.
    """
    tz = business_timezone(business)
    local_now = (now or datetime.now(timezone.utc)).astimezone(tz)
    minimum_notice = max(int(business.minimum_notice_minutes or 0), 0)
    earliest = local_now + timedelta(minutes=minimum_notice)
    slot_minutes = max(15, min(int(business.appointment_slot_minutes or 60), 480))

    existing_slots: set[tuple[str, str]] = set()
    for appointment in appointments:
        if getattr(appointment, "status", None) in {
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
            "cancelled",
            "no_show",
        }:
            continue
        day = getattr(appointment, "scheduled_date", None)
        slot_time = getattr(appointment, "scheduled_time", None)
        if isinstance(day, str) and isinstance(slot_time, str):
            existing_slots.add((day, slot_time[:5]))

    requested_day: date | None = None
    if requested_date:
        try:
            requested_day = date.fromisoformat(requested_date)
        except ValueError:
            return None
    requested_clock = _parse_time(requested_time) if requested_time else None

    first_day = requested_day or earliest.date()
    last_day = first_day + timedelta(days=horizon_days)
    day = first_day
    while day <= last_day:
        hours = _hours_for_day(business, day)
        if hours:
            opens, closes = hours
            candidate = datetime.combine(day, opens, tzinfo=tz)
            if requested_day == day and requested_clock:
                candidate = datetime.combine(day, requested_clock, tzinfo=tz)

            if candidate < earliest:
                rounded_minutes = ((earliest.minute + slot_minutes - 1) // slot_minutes) * slot_minutes
                candidate = earliest.replace(second=0, microsecond=0, minute=0) + timedelta(minutes=rounded_minutes)
                if candidate.date() != day:
                    candidate = datetime.combine(day, opens, tzinfo=tz)

            while candidate.time() < closes:
                end = candidate + timedelta(minutes=slot_minutes)
                if end.time() <= closes and candidate >= earliest and _slot_is_available(candidate, existing_slots):
                    return candidate.date().isoformat(), candidate.strftime("%H:%M")
                if requested_day == day and requested_clock:
                    break
                candidate += timedelta(minutes=slot_minutes)
        if requested_day:
            # If a specifically requested day was unavailable, only offer a
            # nearby alternative when the caller did not specify a time.
            if requested_clock:
                return None
        day += timedelta(days=1)
    return None


def format_business_hours(business: Business) -> str:
    """Give callers a short, conservative answer to an hours FAQ."""
    hours = business.business_hours
    if not isinstance(hours, dict) or not hours:
        return "Our team will confirm current hours when they call you back."
    today = datetime.now(timezone.utc).astimezone(business_timezone(business)).date()
    today_hours = _hours_for_day(business, today)
    if not today_hours:
        return "We are closed today. Our team will follow up as soon as possible."
    opens, closes = today_hours
    opening_text = opens.strftime("%I:%M %p").lstrip("0")
    closing_text = closes.strftime("%I:%M %p").lstrip("0")
    return f"Today we are available from {opening_text} to {closing_text}."
