from pathlib import Path
from time import perf_counter
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.documents.docx_generator import DocxGenerationService
from app.models.enums import OperationStatus, OperationType
from app.models.operation_log import OperationLog
from app.models.partner import Partner
from app.models.partner_template import PartnerTemplate
from app.repositories.operation_log_repository import OperationLogRepository
from app.repositories.partner_template_repository import PartnerTemplateRepository
from app.schemas.generation import ResumeGenerateRequest
from app.storage.factory import get_temporary_file_policy

from .partner_service import PartnerService


class GeneratedResume:
    def __init__(self, path: Path, filename: str) -> None:
        self.path = path
        self.filename = filename


class ResumeGenerationService:
    def __init__(
        self,
        session: AsyncSession,
        generator: DocxGenerationService | None = None,
    ) -> None:
        self.session = session
        self.template_repository = PartnerTemplateRepository(session)
        self.operation_log_repository = OperationLogRepository(session)
        self.generator = generator or DocxGenerationService()

    async def generate_resume(
        self,
        payload: ResumeGenerateRequest,
        user_id: UUID,
    ) -> GeneratedResume:
        started_at = perf_counter()
        partner: Partner | None = None

        try:
            partner = await PartnerService(self.session).get_active_partner(payload.partner_id)
            template = await self._get_active_template(partner.id)

            temporary_policy = get_temporary_file_policy()
            path = temporary_policy.create_generated_file_path()
            self.generator.generate(
                template_path=template.storage_path,
                resume=payload.resume,
                output_path=path,
            )

            await self._log_generation(
                user_id=user_id,
                partner_id=partner.id,
                status=OperationStatus.SUCCESS,
                started_at=started_at,
            )
            return GeneratedResume(
                path=path,
                filename=f"resume_{partner.code}.docx",
            )
        except AppError as exc:
            await self._log_generation(
                user_id=user_id,
                partner_id=partner.id if partner is not None else payload.partner_id,
                status=OperationStatus.FAILED,
                started_at=started_at,
                error_code=exc.code,
            )
            raise
        except Exception as exc:
            await self._log_generation(
                user_id=user_id,
                partner_id=partner.id if partner is not None else payload.partner_id,
                status=OperationStatus.FAILED,
                started_at=started_at,
                error_code="generation.failed",
            )
            raise AppError(
                code="generation.failed",
                message="Не удалось сгенерировать резюме по шаблону партнёра",
                status_code=500,
            ) from exc

    async def _get_active_template(self, partner_id: UUID) -> PartnerTemplate:
        template = await self.template_repository.get_active_by_partner(partner_id)
        if template is None:
            raise AppError(
                code="template.not_found",
                message="Для партнёра не найден активный шаблон",
                status_code=404,
            )
        return template

    async def _log_generation(
        self,
        user_id: UUID,
        partner_id: UUID | None,
        status: OperationStatus,
        started_at: float,
        error_code: str | None = None,
    ) -> None:
        duration_ms = int((perf_counter() - started_at) * 1000)
        self.operation_log_repository.add(
            OperationLog(
                user_id=user_id,
                partner_id=partner_id,
                operation_type=OperationType.GENERATE_RESUME,
                status=status,
                error_code=error_code,
                duration_ms=duration_ms,
            )
        )
        await self.session.commit()
