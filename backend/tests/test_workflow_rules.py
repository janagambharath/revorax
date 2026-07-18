"""Fast regression tests for deterministic call-routing safeguards."""

from __future__ import annotations

import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from app.api.routes.auth import _has_valid_pilot_invite, settings as auth_settings
from app.models.models import Appointment, AppointmentStatus, Business
from app.services.automation_service import can_send_automated_sms
from app.services.ai_service import _fallback_live_call_analysis
from app.services.business_rules import check_customer_request, find_next_available_slot


def make_business(**overrides) -> Business:
    values = {
        "id": uuid4(),
        "owner_id": uuid4(),
        "name": "Northside Heating",
        "timezone": "UTC",
        "business_hours": {
            "mon": {"open": "08:00", "close": "17:00"},
            "tue": {"open": "08:00", "close": "17:00"},
        },
        "services_offered": ["AC Repair", "Maintenance"],
        "service_area_zip_codes": ["78701", "78702"],
        "auto_booking_enabled": True,
        "appointment_slot_minutes": 60,
        "minimum_notice_minutes": 0,
    }
    values.update(overrides)
    return Business(**values)


class BusinessRuleTests(unittest.TestCase):
    def test_auto_booking_requires_configured_hours_service_and_area(self) -> None:
        business = make_business()
        allowed = check_customer_request(
            business,
            zip_code="78701",
            service_type="AC Repair",
            when=datetime(2026, 7, 20, 10, tzinfo=timezone.utc),  # Monday
        )
        self.assertTrue(allowed.can_auto_book)

        outside_area = check_customer_request(
            business,
            zip_code="99999",
            service_type="AC Repair",
            when=datetime(2026, 7, 20, 10, tzinfo=timezone.utc),
        )
        self.assertFalse(outside_area.can_auto_book)

    def test_slot_finder_skips_an_active_appointment(self) -> None:
        business = make_business()
        occupied = Appointment(
            id=uuid4(),
            business_id=business.id,
            scheduled_date="2026-07-20",
            scheduled_time="08:00",
            status=AppointmentStatus.CONFIRMED,
        )
        slot = find_next_available_slot(
            business,
            [occupied],
            requested_date="2026-07-20",
            now=datetime(2026, 7, 19, 10, tzinfo=timezone.utc),
        )
        self.assertEqual(slot, ("2026-07-20", "09:00"))

    def test_address_intake_is_not_misclassified_as_a_location_faq(self) -> None:
        result = _fallback_live_call_analysis(
            "My address is 123 Main Street, Austin, Texas 78701. I need AC Repair.",
            ["AC Repair"],
            expected_field="address",
        )
        self.assertEqual(result["intent"], "service_request")
        self.assertEqual(result["service_type"], "AC Repair")
        self.assertEqual(result["zip_code"], "78701")

    def test_pilot_signup_codes_are_not_open_registration(self) -> None:
        original_codes = auth_settings.PILOT_SIGNUP_CODES
        auth_settings.PILOT_SIGNUP_CODES = ["a-very-long-test-pilot-invite"]
        try:
            self.assertTrue(_has_valid_pilot_invite("a-very-long-test-pilot-invite"))
            self.assertFalse(_has_valid_pilot_invite("incorrect-code"))
            self.assertFalse(_has_valid_pilot_invite(None))
        finally:
            auth_settings.PILOT_SIGNUP_CODES = original_codes

    def test_manual_and_review_sms_respect_the_consent_ledger(self) -> None:
        opted_out = SimpleNamespace(status="opted_out")
        opted_in = SimpleNamespace(status="opted_in")
        conversational = SimpleNamespace(status="conversational")
        self.assertFalse(can_send_automated_sms(None, purpose="manual"))
        self.assertFalse(can_send_automated_sms(opted_out, purpose="manual"))
        self.assertTrue(can_send_automated_sms(opted_in, purpose="manual"))
        self.assertTrue(can_send_automated_sms(opted_in, purpose="review"))
        self.assertFalse(can_send_automated_sms(conversational, purpose="review"))


if __name__ == "__main__":
    unittest.main()
