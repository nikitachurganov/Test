from pydantic import BaseModel, Field


class CreateFormFileRequest(BaseModel):
    field_id: str = Field(..., min_length=1)
    file_name: str = Field(..., min_length=1)
    file_type: str = Field(..., min_length=1)
    file_size: int = Field(ge=0, default=0)
    file_url: str = Field(..., min_length=1)


class FormFileResponse(BaseModel):
    id: str
    request_id: int
    field_id: str
    file_name: str
    file_type: str
    file_size: int
    file_url: str
    created_at: str
