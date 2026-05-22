from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, require_roles
from app.core.errors import AppError
from app.db.session import get_db_session
from app.models.enums import OperationStatus, OperationType, UserRole
from app.models.user import User
from app.schemas.users import (
    UserCreateRequest,
    UserResponse,
    UserRoleUpdateRequest,
    UserUpdateRequest,
)
from app.services.operation_log_service import OperationLogService
from app.services.user_service import UserService

router = APIRouter(
    prefix="/admin/users",
    tags=["admin-users"],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)


@router.get("", response_model=list[UserResponse])
async def list_users(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[User]:
    return await UserService(session).list_users()


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    payload: UserCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    current_user_id = current_user.id
    started_at = OperationLogService.start_timer()
    try:
        user = await UserService(session).create_user(payload)
        await OperationLogService(session).log(
            operation_type=OperationType.CREATE_USER,
            status=OperationStatus.SUCCESS,
            user_id=current_user_id,
            started_at=started_at,
        )
        return user
    except AppError as exc:
        await session.rollback()
        await OperationLogService(session).log(
            operation_type=OperationType.CREATE_USER,
            status=OperationStatus.FAILED,
            user_id=current_user_id,
            error_code=exc.code,
            started_at=started_at,
        )
        raise


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    return await UserService(session).get_user(user_id)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    payload: UserUpdateRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    return await UserService(session).update_user(user_id, payload)


@router.patch("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    payload: UserRoleUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    current_user_id = current_user.id
    started_at = OperationLogService.start_timer()
    try:
        user = await UserService(session).update_role(user_id, payload)
        await OperationLogService(session).log(
            operation_type=OperationType.CHANGE_USER_ROLE,
            status=OperationStatus.SUCCESS,
            user_id=current_user_id,
            started_at=started_at,
        )
        return user
    except AppError as exc:
        await session.rollback()
        await OperationLogService(session).log(
            operation_type=OperationType.CHANGE_USER_ROLE,
            status=OperationStatus.FAILED,
            user_id=current_user_id,
            error_code=exc.code,
            started_at=started_at,
        )
        raise


@router.patch("/{user_id}/block", response_model=UserResponse)
async def block_user(
    user_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    current_user_id = current_user.id
    started_at = OperationLogService.start_timer()
    try:
        user = await UserService(session).block_user(user_id)
        await OperationLogService(session).log(
            operation_type=OperationType.BLOCK_USER,
            status=OperationStatus.SUCCESS,
            user_id=current_user_id,
            started_at=started_at,
        )
        return user
    except AppError as exc:
        await session.rollback()
        await OperationLogService(session).log(
            operation_type=OperationType.BLOCK_USER,
            status=OperationStatus.FAILED,
            user_id=current_user_id,
            error_code=exc.code,
            started_at=started_at,
        )
        raise


@router.patch("/{user_id}/unblock", response_model=UserResponse)
async def unblock_user(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    return await UserService(session).unblock_user(user_id)
