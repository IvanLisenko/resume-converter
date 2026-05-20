from app.core.config import settings
from app.storage.local import LocalTemplateStorage
from app.storage.temporary import TemporaryFilePolicy


def get_template_storage() -> LocalTemplateStorage:
    return LocalTemplateStorage(settings.template_storage_path)


def get_temporary_file_policy() -> TemporaryFilePolicy:
    return TemporaryFilePolicy(
        upload_path=settings.temporary_upload_path,
        generated_path=settings.temporary_generated_path,
    )

