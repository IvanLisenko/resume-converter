from fastapi import APIRouter
from sqlalchemy import text

from app.core.errors import AppError
from app.db.session import async_session_maker
from app.schemas.system import HealthResponse, ReadyResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/ready", response_model=ReadyResponse)
async def ready() -> ReadyResponse:
    try:
        async with async_session_maker() as session:
            await session.execute(text("select 1"))
    except Exception as exc:
        raise AppError(
            code="service.not_ready",
            message="Сервис не готов к обработке запросов",
            status_code=503,
        ) from exc

    return ReadyResponse(status="ok", database="ok")
