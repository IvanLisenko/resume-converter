from sqlalchemy.ext.asyncio import AsyncSession

from app.models.operation_log import OperationLog


class OperationLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def add(self, operation_log: OperationLog) -> None:
        self.session.add(operation_log)
