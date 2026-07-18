"""
Business routes — CRUD for the HVAC company profile + onboarding.
"""

from secrets import compare_digest

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import get_settings
from app.api.deps import get_current_user
from app.models.models import User, Business, BusinessStatus
from app.schemas.schemas import (
    BusinessCreate,
    BusinessUpdate,
    BusinessResponse,
    TwilioNumberAttach,
)
from app.services.twilio_service import provision_phone_number
from app.services.automation_service import is_safe_crm_webhook_url
from app.services.phone_activation_service import attach_existing_twilio_number

router = APIRouter(prefix="/business", tags=["business"])
settings = get_settings()


@router.post("/", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
async def create_business(
    data: BusinessCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a business profile (onboarding step 1).

    Number provisioning is intentionally an operator-controlled production
    switch: it creates a chargeable Twilio resource and must not be exposed to
    unapproved public signups.
    """
    # Check if user already has a business
    result = await db.execute(
        select(Business).where(Business.owner_id == current_user.id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a business registered",
        )

    if data.auto_booking_enabled and (
        not data.business_hours
        or not data.services_offered
        or not data.service_area_zip_codes
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Configure business hours, offered services, and service-area ZIP codes "
                "before enabling automatic booking."
            ),
        )
    if data.crm_webhook_url and not settings.CRM_WEBHOOK_SIGNING_SECRET:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Set CRM_WEBHOOK_SIGNING_SECRET before enabling a CRM connector.",
        )
    if data.crm_webhook_url and not is_safe_crm_webhook_url(data.crm_webhook_url):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CRM webhook host is not on the operator-approved allowlist.",
        )

    twilio_number = {"phone_number": None, "sid": None}
    if settings.ENABLE_SELF_SERVICE_PROVISIONING:
        area_code = data.zip_code[:3] if data.zip_code and len(data.zip_code) >= 3 else "512"
        try:
            twilio_number = await provision_phone_number(area_code=area_code)
        except Exception:
            # Don't block onboarding if a provider is temporarily unavailable.
            twilio_number = {"phone_number": None, "sid": None}

    business = Business(
        owner_id=current_user.id,
        name=data.name,
        address=data.address,
        city=data.city,
        state=data.state,
        zip_code=data.zip_code,
        business_phone=data.business_phone,
        website=data.website,
        business_hours=data.business_hours,
        services_offered=data.services_offered,
        service_area_zip_codes=data.service_area_zip_codes,
        faqs=data.faqs,
        call_transfer_number=data.call_transfer_number,
        auto_booking_enabled=data.auto_booking_enabled,
        appointment_slot_minutes=data.appointment_slot_minutes,
        minimum_notice_minutes=data.minimum_notice_minutes,
        review_request_enabled=data.review_request_enabled,
        review_request_delay_hours=data.review_request_delay_hours,
        crm_webhook_url=data.crm_webhook_url,
        timezone=data.timezone,
        twilio_phone_number=twilio_number["phone_number"],
        twilio_phone_sid=twilio_number["sid"],
        status=BusinessStatus.ACTIVE if twilio_number["phone_number"] else BusinessStatus.ONBOARDING,
    )

    db.add(business)
    await db.flush()
    await db.refresh(business)
    return business


@router.get("/", response_model=BusinessResponse)
async def get_business(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's business profile."""
    result = await db.execute(
        select(Business).where(Business.owner_id == current_user.id)
    )
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business found. Complete onboarding first.",
        )
    return business


@router.patch("/", response_model=BusinessResponse)
async def update_business(
    data: BusinessUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update business settings (hours, services, greeting, etc.)."""
    result = await db.execute(
        select(Business).where(Business.owner_id == current_user.id)
    )
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(business, key, value)

    if business.auto_booking_enabled and (
        not business.business_hours
        or not business.services_offered
        or not business.service_area_zip_codes
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Configure business hours, offered services, and service-area ZIP codes "
                "before enabling automatic booking."
            ),
        )
    if business.crm_webhook_url and not settings.CRM_WEBHOOK_SIGNING_SECRET:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Set CRM_WEBHOOK_SIGNING_SECRET before enabling a CRM connector.",
        )
    if business.crm_webhook_url and not is_safe_crm_webhook_url(business.crm_webhook_url):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CRM webhook host is not on the operator-approved allowlist.",
        )

    await db.flush()
    await db.refresh(business)
    return business


@router.post(
    "/internal/attach-twilio-number",
    response_model=BusinessResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
async def attach_twilio_number_for_business(
    data: TwilioNumberAttach,
    x_revorax_admin_token: str | None = Header(None, alias="X-Revorax-Admin-Token"),
    db: AsyncSession = Depends(get_db),
):
    """Operator-only bridge from a verified Twilio number to one tenant."""
    if not settings.ADMIN_PROVISIONING_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Operator provisioning is not configured.",
        )
    if not x_revorax_admin_token or not compare_digest(
        x_revorax_admin_token, settings.ADMIN_PROVISIONING_TOKEN
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid operator token")

    result = await db.execute(select(Business).where(Business.id == data.business_id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    assigned_result = await db.execute(
        select(Business).where(Business.twilio_phone_number == data.phone_number)
    )
    assigned = assigned_result.scalar_one_or_none()
    if assigned and assigned.id != business.id:
        raise HTTPException(status_code=409, detail="That Twilio number is already assigned")

    try:
        provider_number = await attach_existing_twilio_number(data.phone_number)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Twilio could not activate this number. Check operator logs and retry.",
        )

    canonical_result = await db.execute(
        select(Business).where(Business.twilio_phone_number == provider_number["phone_number"])
    )
    canonical_assigned = canonical_result.scalar_one_or_none()
    if canonical_assigned and canonical_assigned.id != business.id:
        raise HTTPException(status_code=409, detail="That Twilio number is already assigned")

    business.twilio_phone_number = provider_number["phone_number"]
    business.twilio_phone_sid = provider_number["sid"]
    business.status = BusinessStatus.ACTIVE
    await db.flush()
    await db.refresh(business)
    return business
