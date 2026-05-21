from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import uuid4


class TemporaryFilePolicy:
    def __init__(self, upload_path: str | Path, generated_path: str | Path) -> None:
        self.upload_path = Path(upload_path)
        self.generated_path = Path(generated_path)

    @contextmanager
    def upload_file(self, suffix: str = ".docx") -> Iterator[Path]:
        with self._temporary_file(self.upload_path, suffix) as path:
            yield path

    @contextmanager
    def generated_file(self, suffix: str = ".docx") -> Iterator[Path]:
        with self._temporary_file(self.generated_path, suffix) as path:
            yield path

    def create_generated_file_path(self, suffix: str = ".docx") -> Path:
        self.generated_path.mkdir(parents=True, exist_ok=True)
        return self.generated_path / f"{uuid4()}{suffix}"

    @contextmanager
    def _temporary_file(self, directory: Path, suffix: str) -> Iterator[Path]:
        directory.mkdir(parents=True, exist_ok=True)
        temporary_file = NamedTemporaryFile(delete=False, dir=directory, suffix=suffix)
        path = Path(temporary_file.name)
        temporary_file.close()

        try:
            yield path
        finally:
            path.unlink(missing_ok=True)
