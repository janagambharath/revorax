"""
Business routes — CRUD for the HVAC company profile + onboarding.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Business, BusinessStatus
from app.schemas.schemas import BusinessCreate, BusinessUpdate, BusinessResponse
from app.services.twilio_service import provision_phone_number

router = APIRouter(prefix="/business", tags=["business"])


@router.post("/", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
async def create_business(
    data: BusinessCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a business profile (onboarding step 1).
    Provisions a Twilio phone number automatically.
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

    # Provision a Twilio phone number
    area_code = data.zip_code[:3] if data.zip_code and len(data.zip_code) >= 3 else "512"
    try:
        twilio_number = await provision_phone_number(area_code=area_code)
    except Exception:
        # Don't block onboarding if Twilio provisioning fails
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

    await db.flush()
    await db.refresh(business)
    return business
