from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_roles
from app.db.session import get_db_session
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.users import (
    UserCreateRequest,
    UserResponse,
    UserRoleUpdateRequest,
    UserUpdateRequest,
)
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
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    return await UserService(session).create_user(payload)


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
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    return await UserService(session).update_role(user_id, payload)


@router.patch("/{user_id}/block", response_model=UserResponse)
async def block_user(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    return await UserService(session).block_user(user_id)


@router.patch("/{user_id}/unblock", response_model=UserResponse)
async def unblock_user(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    return await UserService(session).unblock_user(user_id)
