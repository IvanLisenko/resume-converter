from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OperationStatus, OperationType


class OperationLogResponse(BaseModel):
    id: UUID
    user_id: UUID | None
    partner_id: UUID | None
    operation_type: OperationType
    status: OperationStatus
    error_code: str | None
    duration_ms: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OperationLogListQuery(BaseModel):
    limit: int = Field(default=100, ge=1, le=500)
