from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.users import UserCreateRequest, UserRoleUpdateRequest, UserUpdateRequest


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = UserRepository(session)

    async def list_users(self) -> list[User]:
        return await self.repository.list_all()

    async def get_user(self, user_id: UUID) -> User:
        user = await self.repository.get_by_id(user_id)
        if user is None:
            raise AppError(
                code="user.not_found",
                message="Сотрудник не найден",
                status_code=404,
            )
        return user

    async def create_user(self, payload: UserCreateRequest) -> User:
        email = str(payload.email).strip().lower()
        await self._ensure_email_available(email)

        user = User(
            email=email,
            full_name=payload.full_name.strip(),
            password_hash=hash_password(payload.password),
            role=payload.role,
            is_active=True,
        )
        self.repository.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update_user(self, user_id: UUID, payload: UserUpdateRequest) -> User:
        user = await self.get_user(user_id)

        if payload.email is not None:
            email = str(payload.email).strip().lower()
            await self._ensure_email_available(email, current_user_id=user.id)
            user.email = email

        if payload.full_name is not None:
            user.full_name = payload.full_name.strip()

        if payload.password is not None:
            user.password_hash = hash_password(payload.password)

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update_role(self, user_id: UUID, payload: UserRoleUpdateRequest) -> User:
        user = await self.get_user(user_id)
        user.role = payload.role
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def block_user(self, user_id: UUID) -> User:
        user = await self.get_user(user_id)
        user.is_active = False
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def unblock_user(self, user_id: UUID) -> User:
        user = await self.get_user(user_id)
        user.is_active = True
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def create_or_update_first_admin(
        self,
        email: str,
        full_name: str,
        password: str,
    ) -> User:
        normalized_email = email.strip().lower()
        user = await self.repository.get_by_email(normalized_email)
        if user is None:
            user = User(
                email=normalized_email,
                full_name=full_name.strip(),
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
                is_active=True,
            )
            self.repository.add(user)
        else:
            user.full_name = full_name.strip()
            user.password_hash = hash_password(password)
            user.role = UserRole.ADMIN
            user.is_active = True

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def _ensure_email_available(
        self,
        email: str,
        current_user_id: UUID | None = None,
    ) -> None:
        existing_user = await self.repository.get_by_email(email)
        if existing_user is not None and existing_user.id != current_user_id:
            raise AppError(
                code="user.email_already_exists",
                message="Сотрудник с таким email уже существует",
                status_code=409,
            )

