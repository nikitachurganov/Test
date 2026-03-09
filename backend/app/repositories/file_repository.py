import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.form_file import FormFile


async def get_by_request_id(session: AsyncSession, request_id: int) -> list[FormFile]:
    stmt = (
        select(FormFile)
        .where(FormFile.request_id == request_id)
        .order_by(FormFile.created_at.asc())
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_by_id(session: AsyncSession, file_id: uuid.UUID) -> FormFile | None:
    return await session.get(FormFile, file_id)


async def create(session: AsyncSession, file: FormFile) -> FormFile:
    session.add(file)
    await session.flush()
    await session.refresh(file)
    return file


async def remove(session: AsyncSession, file_id: uuid.UUID) -> bool:
    stmt = delete(FormFile).where(FormFile.id == file_id)
    result = await session.execute(stmt)
    return result.rowcount > 0
