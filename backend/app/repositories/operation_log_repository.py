from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.operation_log import OperationLog


class OperationLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def add(self, operation_log: OperationLog) -> None:
        self.session.add(operation_log)

    async def list_recent(self, limit: int = 100) -> list[OperationLog]:
        result = await self.session.execute(
            select(OperationLog).order_by(OperationLog.created_at.desc()).limit(limit),
        )
        return list(result.scalars().all())
