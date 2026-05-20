from pathlib import Path

from docx import Document
from docx.opc.exceptions import PackageNotFoundError

from app.core.errors import AppError


class PartnerTemplateFileValidator:
    def validate_docx(self, path: str | Path) -> None:
        try:
            Document(path)
        except PackageNotFoundError as exc:
            raise AppError(
                code="template.invalid",
                message="Шаблон должен быть корректным .docx документом",
                status_code=400,
            ) from exc
        except Exception as exc:
            raise AppError(
                code="template.invalid",
                message="Не удалось прочитать .docx шаблон",
                status_code=400,
            ) from exc
