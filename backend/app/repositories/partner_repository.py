from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.partner import Partner


class PartnerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, partner_id: UUID) -> Partner | None:
        result = await self.session.execute(
            select(Partner).where(Partner.id == partner_id),
        )
        return result.scalar_one_or_none()

    async def get_active_by_id(self, partner_id: UUID) -> Partner | None:
        result = await self.session.execute(
            select(Partner).where(Partner.id == partner_id, Partner.is_active.is_(True)),
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Partner | None:
        result = await self.session.execute(
            select(Partner).where(Partner.code == code.strip().lower()),
        )
        return result.scalar_one_or_none()

    async def list_active(self) -> list[Partner]:
        result = await self.session.execute(
            select(Partner).where(Partner.is_active.is_(True)).order_by(Partner.name),
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[Partner]:
        result = await self.session.execute(
            select(Partner)
            .options(selectinload(Partner.templates))
            .order_by(Partner.created_at.desc()),
        )
        return list(result.scalars().all())

    def add(self, partner: Partner) -> None:
        self.session.add(partner)
