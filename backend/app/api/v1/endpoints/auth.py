from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.errors import AppError
from app.core.security import create_access_token, verify_password
from app.db.session import get_db_session
from app.models.enums import OperationStatus, OperationType
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import CurrentUserResponse, LoginRequest, LogoutResponse, TokenResponse
from app.services.operation_log_service import OperationLogService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> TokenResponse:
    started_at = OperationLogService.start_timer()
    user = await UserRepository(session).get_by_email(str(payload.email))
    invalid_credentials = (
        user is None
        or not user.is_active
        or not verify_password(payload.password, user.password_hash)
    )
    if invalid_credentials:
        await OperationLogService(session).log(
            operation_type=OperationType.LOGIN,
            status=OperationStatus.FAILED,
            user_id=user.id if user is not None else None,
            error_code="auth.unauthorized",
            started_at=started_at,
        )
        raise AppError(
            code="auth.unauthorized",
            message="Неверный email или пароль",
            status_code=401,
        )

    await OperationLogService(session).log(
        operation_type=OperationType.LOGIN,
        status=OperationStatus.SUCCESS,
        user_id=user.id,
        started_at=started_at,
    )
    return TokenResponse(access_token=create_access_token(user.id, user.role))


@router.post("/logout", response_model=LogoutResponse)
async def logout(current_user: Annotated[User, Depends(get_current_user)]) -> LogoutResponse:
    return LogoutResponse(status="ok")


@router.get("/me", response_model=CurrentUserResponse)
async def me(current_user: Annotated[User, Depends(get_current_user)]) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
    )
