from pathlib import Path

from docxtpl import DocxTemplate

from app.core.errors import AppError
from app.documents.template_context import TemplateContextMapper
from app.schemas.resume import ResumeData


class DocxGenerationService:
    def __init__(self, context_mapper: TemplateContextMapper | None = None) -> None:
        self.context_mapper = context_mapper or TemplateContextMapper()

    def generate(
        self,
        template_path: str | Path,
        resume: ResumeData,
        output_path: str | Path,
    ) -> None:
        try:
            document = DocxTemplate(template_path)
            document.render(self.context_mapper.map_resume(resume))
            document.save(output_path)
        except Exception as exc:
            raise AppError(
                code="generation.failed",
                message="Не удалось сгенерировать резюме по шаблону партнёра",
                status_code=500,
            ) from exc
