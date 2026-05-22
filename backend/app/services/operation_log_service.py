from time import perf_counter
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import OperationStatus, OperationType
from app.models.operation_log import OperationLog
from app.repositories.operation_log_repository import OperationLogRepository


class OperationLogService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = OperationLogRepository(session)

    async def log(
        self,
        operation_type: OperationType,
        status: OperationStatus,
        user_id: UUID | None = None,
        partner_id: UUID | None = None,
        error_code: str | None = None,
        started_at: float | None = None,
    ) -> None:
        duration_ms = self._duration_ms(started_at)
        self.repository.add(
            OperationLog(
                user_id=user_id,
                partner_id=partner_id,
                operation_type=operation_type,
                status=status,
                error_code=error_code,
                duration_ms=duration_ms,
            )
        )
        await self.session.commit()

    @staticmethod
    def start_timer() -> float:
        return perf_counter()

    @staticmethod
    def _duration_ms(started_at: float | None) -> int | None:
        if started_at is None:
            return None
        return int((perf_counter() - started_at) * 1000)
