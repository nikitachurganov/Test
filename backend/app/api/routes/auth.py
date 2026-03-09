from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserProfileResponse
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, session: DbSession) -> TokenResponse:
    return await auth_service.register(session, payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: DbSession) -> TokenResponse:
    return await auth_service.login(session, payload)


@router.get("/me", response_model=UserProfileResponse)
async def me(user: CurrentUser) -> UserProfileResponse:
    return auth_service.build_profile_response(user)
