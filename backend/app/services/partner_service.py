from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.partner import Partner
from app.repositories.partner_repository import PartnerRepository
from app.schemas.partners import PartnerCreateRequest, PartnerUpdateRequest


class PartnerService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = PartnerRepository(session)

    async def list_active_partners(self) -> list[Partner]:
        return await self.repository.list_active()

    async def list_all_partners(self) -> list[Partner]:
        return await self.repository.list_all()

    async def get_active_partner(self, partner_id: UUID) -> Partner:
        partner = await self.repository.get_active_by_id(partner_id)
        if partner is None:
            raise AppError(
                code="partner.not_found",
                message="Партнёр не найден",
                status_code=404,
            )
        return partner

    async def get_partner(self, partner_id: UUID) -> Partner:
        partner = await self.repository.get_by_id(partner_id)
        if partner is None:
            raise AppError(
                code="partner.not_found",
                message="Партнёр не найден",
                status_code=404,
            )
        return partner

    async def create_partner(self, payload: PartnerCreateRequest) -> Partner:
        await self._ensure_code_available(payload.code)
        partner = Partner(
            code=payload.code,
            name=payload.name,
            description=payload.description,
            is_active=True,
        )
        self.repository.add(partner)
        await self.session.commit()
        await self.session.refresh(partner)
        return partner

    async def update_partner(self, partner_id: UUID, payload: PartnerUpdateRequest) -> Partner:
        partner = await self.get_partner(partner_id)
        changed_fields = payload.model_fields_set

        if "code" in changed_fields and payload.code is not None:
            await self._ensure_code_available(payload.code, current_partner_id=partner.id)
            partner.code = payload.code
        if "name" in changed_fields and payload.name is not None:
            partner.name = payload.name
        if "description" in changed_fields:
            partner.description = payload.description
        if "is_active" in changed_fields and payload.is_active is not None:
            partner.is_active = payload.is_active

        await self.session.commit()
        await self.session.refresh(partner)
        return partner

    async def deactivate_partner(self, partner_id: UUID) -> Partner:
        partner = await self.get_partner(partner_id)
        partner.is_active = False
        await self.session.commit()
        await self.session.refresh(partner)
        return partner

    async def _ensure_code_available(
        self,
        code: str,
        current_partner_id: UUID | None = None,
    ) -> None:
        existing_partner = await self.repository.get_by_code(code)
        if existing_partner is not None and existing_partner.id != current_partner_id:
            raise AppError(
                code="partner.code_already_exists",
                message="Партнёр с таким кодом уже существует",
                status_code=409,
            )
