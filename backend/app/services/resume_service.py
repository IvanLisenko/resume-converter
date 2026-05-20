from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.core.errors import AppError
from app.documents.trive_parser import TriveParseResult, TriveResumeParser
from app.storage.factory import get_temporary_file_policy


class ResumeService:
    def __init__(self, parser: TriveResumeParser | None = None) -> None:
        self.parser = parser or TriveResumeParser()

    async def extract_trive_resume(self, file: UploadFile | None) -> tuple[TriveParseResult, int]:
        if file is None:
            raise AppError(
                code="resume.invalid_format",
                message="Файл резюме не передан",
                status_code=400,
            )

        self._validate_filename(file.filename)

        temporary_policy = get_temporary_file_policy()
        with temporary_policy.upload_file(suffix=".docx") as path:
            size_bytes = await self._save_upload_to_temporary_file(file, path)
            return self.parser.parse(path), size_bytes

    async def _save_upload_to_temporary_file(self, file: UploadFile, path: Path) -> int:
        size_bytes = 0
        with path.open("wb") as target:
            while chunk := await file.read(1024 * 1024):
                size_bytes += len(chunk)
                if size_bytes > settings.max_resume_file_size_bytes:
                    raise AppError(
                        code="resume.file_too_large",
                        message="Размер файла не должен превышать 10 МБ",
                        status_code=413,
                    )
                target.write(chunk)

        if size_bytes == 0:
            raise AppError(
                code="resume.invalid_format",
                message="Файл резюме не передан или пуст",
                status_code=400,
            )

        return size_bytes

    @staticmethod
    def _validate_filename(filename: str | None) -> None:
        if not filename:
            raise AppError(
                code="resume.invalid_format",
                message="Файл резюме не передан",
                status_code=400,
            )
        if not filename.lower().endswith(".docx"):
            raise AppError(
                code="resume.invalid_format",
                message="Файл должен быть в формате .docx",
                status_code=400,
            )
