from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import decode_access_token
from app.db.session import get_db_session
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)
BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]
DbSession = Annotated[AsyncSession, Depends(get_db_session)]


async def get_current_user(
    credentials: BearerCredentials,
    session: DbSession,
) -> User:
    if credentials is None:
        raise AppError(
            code="auth.unauthorized",
            message="Требуется токен доступа",
            status_code=401,
        )

    payload = decode_access_token(credentials.credentials)
    subject = payload.get("sub")
    if subject is None:
        raise AppError(
            code="auth.unauthorized",
            message="Недействительный токен доступа",
            status_code=401,
        )

    try:
        user_id = UUID(subject)
    except ValueError as exc:
        raise AppError(
            code="auth.unauthorized",
            message="Недействительный токен доступа",
            status_code=401,
        ) from exc

    user = await UserRepository(session).get_by_id(user_id)
    if user is None or not user.is_active:
        raise AppError(
            code="auth.unauthorized",
            message="Пользователь не найден или заблокирован",
            status_code=401,
        )

    return user


def require_roles(*roles: UserRole) -> Callable:
    async def dependency(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in roles:
            raise AppError(
                code="auth.forbidden",
                message="Недостаточно прав для выполнения операции",
                status_code=403,
            )
        return current_user

    return dependency
