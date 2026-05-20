import hashlib
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID


@dataclass(frozen=True)
class StoredTemplateFile:
    path: Path
    checksum: str
    size_bytes: int


class LocalTemplateStorage:
    def __init__(self, base_path: str | Path) -> None:
        self.base_path = Path(base_path)

    def save_template(
        self,
        partner_code: str,
        template_id: UUID,
        source_path: str | Path,
    ) -> StoredTemplateFile:
        source = Path(source_path)
        target = self.template_path(partner_code, template_id)
        target.parent.mkdir(parents=True, exist_ok=True)

        shutil.copyfile(source, target)

        return StoredTemplateFile(
            path=target,
            checksum=self.calculate_checksum(target),
            size_bytes=target.stat().st_size,
        )

    def template_path(self, partner_code: str, template_id: UUID) -> Path:
        safe_partner_code = self._safe_segment(partner_code)
        return self.base_path / safe_partner_code / f"{template_id}.docx"

    @staticmethod
    def calculate_checksum(path: str | Path) -> str:
        digest = hashlib.sha256()
        with Path(path).open("rb") as file:
            for chunk in iter(lambda: file.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    @staticmethod
    def _safe_segment(value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[a-z0-9_-]+", normalized):
            raise ValueError("Некорректный сегмент пути файлового хранилища")
        return normalized
