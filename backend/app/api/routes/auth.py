"""
Auth routes — signup, login, token refresh, current user.
"""

import hmac

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import (
    create_user,
    get_user_by_email,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.api.deps import get_current_user
from app.core.config import get_settings
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _has_valid_pilot_invite(invite_code: str | None) -> bool:
    """Compare operator-managed pilot codes without revealing a match."""
    supplied = (invite_code or "").strip()
    if not supplied:
        return False
    configured_codes = [
        value.strip()
        for value in settings.PILOT_SIGNUP_CODES
        if isinstance(value, str) and value.strip()
    ]
    return any(hmac.compare_digest(supplied, candidate) for candidate in configured_codes)


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register an approved pilot user; public sign-up is intentionally gated."""
    if not settings.ENABLE_SELF_SERVICE_SIGNUP and not _has_valid_pilot_invite(data.invite_code):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Revorax is currently available by approved pilot invitation.",
        )
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = await create_user(
        db=db,
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        phone=data.phone,
    )

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive tokens."""
    user = await get_user_by_email(db, data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    """Get a new access token using a refresh token."""
    payload = verify_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    return TokenResponse(
        access_token=create_access_token(payload["sub"]),
        refresh_token=create_refresh_token(payload["sub"]),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user."""
    return current_user
