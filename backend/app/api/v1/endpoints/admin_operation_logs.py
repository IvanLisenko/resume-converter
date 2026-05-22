from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_roles
from app.db.session import get_db_session
from app.models.enums import UserRole
from app.models.operation_log import OperationLog
from app.repositories.operation_log_repository import OperationLogRepository
from app.schemas.operation_logs import OperationLogResponse

router = APIRouter(
    prefix="/admin/operation-logs",
    tags=["admin-operation-logs"],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)


@router.get("", response_model=list[OperationLogResponse])
async def list_operation_logs(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[OperationLog]:
    return await OperationLogRepository(session).list_recent(limit)
