from datetime import datetime

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    middle_name: str | None
    full_name: str
    email: str
    phone_number: str
    avatar_url: str | None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    """Matches the frontend UserProfile interface."""
    id: str
    firstName: str
    lastName: str
    middleName: str | None
    fullName: str
    email: str
    phoneNumber: str
    avatarUrl: str | None
    createdAt: str


class PublicAuthorResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    middle_name: str | None
    email: str
