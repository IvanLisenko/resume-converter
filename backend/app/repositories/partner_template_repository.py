from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.partner_template import PartnerTemplate


class PartnerTemplateRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_by_partner(self, partner_id: UUID) -> list[PartnerTemplate]:
        result = await self.session.execute(
            select(PartnerTemplate)
            .where(PartnerTemplate.partner_id == partner_id)
            .order_by(PartnerTemplate.version.desc()),
        )
        return list(result.scalars().all())

    async def get_active_by_partner(self, partner_id: UUID) -> PartnerTemplate | None:
        result = await self.session.execute(
            select(PartnerTemplate).where(
                PartnerTemplate.partner_id == partner_id,
                PartnerTemplate.is_active.is_(True),
            ),
        )
        return result.scalar_one_or_none()

    async def get_next_version(self, partner_id: UUID) -> int:
        templates = await self.list_by_partner(partner_id)
        if not templates:
            return 1
        return max(template.version for template in templates) + 1

    async def deactivate_partner_templates(self, partner_id: UUID) -> None:
        await self.session.execute(
            update(PartnerTemplate)
            .where(PartnerTemplate.partner_id == partner_id)
            .values(is_active=False),
        )

    def add(self, template: PartnerTemplate) -> None:
        self.session.add(template)
