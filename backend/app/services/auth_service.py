import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.name_utils import build_display_name
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories import user_repository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserProfileResponse


async def register(session: AsyncSession, payload: RegisterRequest) -> TokenResponse:
    existing = await user_repository.get_by_email(session, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    if not payload.first_name or not payload.last_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="first_name and last_name are required",
        )

    user = User(
        full_name=build_display_name(
            last_name=payload.last_name,
            first_name=payload.first_name,
            middle_name=payload.middle_name,
        ),
        first_name=payload.first_name,
        last_name=payload.last_name,
        middle_name=payload.middle_name,
        email=payload.email,
        phone_number=payload.phone_number,
        password_hash=hash_password(payload.password),
    )
    user = await user_repository.create(session, user)
    await session.commit()

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


async def login(session: AsyncSession, payload: LoginRequest) -> TokenResponse:
    user = await user_repository.get_by_email(session, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


def build_profile_response(user: User) -> UserProfileResponse:
    display_name = build_display_name(
        last_name=user.last_name,
        first_name=user.first_name,
        middle_name=user.middle_name,
    )
    return UserProfileResponse(
        id=str(user.id),
        firstName=user.first_name,
        lastName=user.last_name,
        middleName=user.middle_name,
        fullName=display_name,
        email=user.email,
        phoneNumber=user.phone_number,
        avatarUrl=user.avatar_url,
        createdAt=user.created_at.isoformat(),
    )
