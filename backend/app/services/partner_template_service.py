from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.documents.template_validator import PartnerTemplateFileValidator
from app.models.partner_template import PartnerTemplate
from app.repositories.partner_template_repository import PartnerTemplateRepository
from app.storage.factory import get_template_storage, get_temporary_file_policy

from .partner_service import PartnerService


class PartnerTemplateService:
    def __init__(
        self,
        session: AsyncSession,
        validator: PartnerTemplateFileValidator | None = None,
    ) -> None:
        self.session = session
        self.repository = PartnerTemplateRepository(session)
        self.validator = validator or PartnerTemplateFileValidator()

    async def list_partner_templates(self, partner_id: UUID) -> list[PartnerTemplate]:
        await PartnerService(self.session).get_partner(partner_id)
        return await self.repository.list_by_partner(partner_id)

    async def upload_template(
        self,
        partner_id: UUID,
        file: UploadFile | None,
        uploaded_by: UUID,
    ) -> PartnerTemplate:
        if file is None:
            raise AppError(
                code="template.invalid",
                message="Файл шаблона не передан",
                status_code=400,
            )
        self._validate_filename(file.filename)

        partner = await PartnerService(self.session).get_partner(partner_id)
        template_id = uuid4()

        temporary_policy = get_temporary_file_policy()
        with temporary_policy.upload_file(suffix=".docx") as temporary_path:
            await self._save_upload_to_temporary_file(file, temporary_path)
            self.validator.validate_docx(temporary_path)
            variables_schema = self.validator.validate_template_variables(temporary_path)

            template_storage = get_template_storage()
            stored_template = template_storage.save_template(
                partner_code=partner.code,
                template_id=template_id,
                source_path=temporary_path,
            )

            try:
                await self.repository.deactivate_partner_templates(partner.id)
                template = PartnerTemplate(
                    id=template_id,
                    partner_id=partner.id,
                    version=await self.repository.get_next_version(partner.id),
                    original_filename=file.filename or "template.docx",
                    storage_path=str(stored_template.path),
                    checksum=stored_template.checksum,
                    variables_schema=variables_schema,
                    is_active=True,
                    uploaded_by=uploaded_by,
                )
                self.repository.add(template)
                await self.session.commit()
                await self.session.refresh(template)
                return template
            except Exception:
                template_storage.delete_file(stored_template.path)
                raise

    async def _save_upload_to_temporary_file(self, file: UploadFile, path: Path) -> None:
        size_bytes = 0
        with path.open("wb") as target:
            while chunk := await file.read(1024 * 1024):
                size_bytes += len(chunk)
                target.write(chunk)

        if size_bytes == 0:
            raise AppError(
                code="template.invalid",
                message="Файл шаблона не передан или пуст",
                status_code=400,
            )

    @staticmethod
    def _validate_filename(filename: str | None) -> None:
        if not filename:
            raise AppError(
                code="template.invalid",
                message="Файл шаблона не передан",
                status_code=400,
            )
        if not filename.lower().endswith(".docx"):
            raise AppError(
                code="template.invalid",
                message="Шаблон должен быть в формате .docx",
                status_code=400,
            )
