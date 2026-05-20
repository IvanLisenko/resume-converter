from uuid import uuid4

import pytest

from app.storage.local import LocalTemplateStorage
from app.storage.temporary import TemporaryFilePolicy


def test_upload_file_is_removed_after_context(tmp_path):
    policy = TemporaryFilePolicy(
        upload_path=tmp_path / "uploads",
        generated_path=tmp_path / "generated",
    )

    with policy.upload_file() as path:
        path.write_bytes(b"resume")
        assert path.exists()
        created_path = path

    assert not created_path.exists()


def test_generated_file_is_removed_after_exception(tmp_path):
    policy = TemporaryFilePolicy(
        upload_path=tmp_path / "uploads",
        generated_path=tmp_path / "generated",
    )

    with pytest.raises(RuntimeError):
        with policy.generated_file() as path:
            path.write_bytes(b"generated")
            created_path = path
            raise RuntimeError("generation failed")

    assert not created_path.exists()


def test_template_storage_saves_only_to_partner_template_directory(tmp_path):
    storage = LocalTemplateStorage(tmp_path / "templates")
    source = tmp_path / "source.docx"
    source.write_bytes(b"template")
    template_id = uuid4()

    stored = storage.save_template("mosbirzha", template_id, source)

    assert stored.path == tmp_path / "templates" / "mosbirzha" / f"{template_id}.docx"
    assert stored.path.read_bytes() == b"template"
    assert stored.size_bytes == len(b"template")
    assert len(stored.checksum) == 64


def test_template_storage_rejects_unsafe_partner_code(tmp_path):
    storage = LocalTemplateStorage(tmp_path / "templates")

    with pytest.raises(ValueError):
        storage.template_path("../unsafe", uuid4())

