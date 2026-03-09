from typing import Any

from pydantic import BaseModel, Field

from app.schemas.user import PublicAuthorResponse


class CreateFormRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    pages: list[Any] = Field(default_factory=list)


class UpdateFormRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    pages: list[Any] = Field(default_factory=list)


class FormResponse(BaseModel):
    """Matches the frontend FormResponse interface.

    The `fields` JSONB column stores the pages array.
    The API returns it as `pages` to match the frontend contract.
    """
    id: str
    name: str
    description: str
    pages: list[Any]
    created_by_user_id: str | None
    author: PublicAuthorResponse | None
    created_at: str
    updated_at: str
