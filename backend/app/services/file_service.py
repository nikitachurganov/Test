import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.form_file import FormFile
from app.repositories import file_repository, request_repository
from app.schemas.form_file import CreateFormFileRequest, FormFileResponse


def _to_response(f: FormFile) -> FormFileResponse:
    return FormFileResponse(
        id=str(f.id),
        request_id=f.request_id,
        field_id=f.field_id,
        file_name=f.file_name,
        file_type=f.file_type,
        file_size=f.file_size,
        file_url=f.file_url,
        created_at=f.created_at.isoformat(),
    )


async def list_files_for_request(
    session: AsyncSession, request_id: int
) -> list[FormFileResponse]:
    req = await request_repository.get_by_id(session, request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    files = await file_repository.get_by_request_id(session, request_id)
    return [_to_response(f) for f in files]


async def create_file_metadata(
    session: AsyncSession, request_id: int, payload: CreateFormFileRequest
) -> FormFileResponse:
    req = await request_repository.get_by_id(session, request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    file = FormFile(
        request_id=request_id,
        field_id=payload.field_id,
        file_name=payload.file_name,
        file_type=payload.file_type,
        file_size=payload.file_size,
        file_url=payload.file_url,
    )
    file = await file_repository.create(session, file)
    await session.commit()
    return _to_response(file)


async def delete_file(session: AsyncSession, file_id: str) -> None:
    # TODO: When a file storage backend is connected, delete the actual
    # file object here before removing the metadata row.
    deleted = await file_repository.remove(session, uuid.UUID(file_id))
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    await session.commit()
