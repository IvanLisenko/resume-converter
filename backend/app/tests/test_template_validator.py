import pytest
from docx import Document

from app.core.errors import AppError
from app.documents.template_validator import PartnerTemplateFileValidator


def _create_docx(path, paragraphs: list[str]) -> None:
    document = Document()
    for paragraph in paragraphs:
        document.add_paragraph(paragraph)
    document.save(path)


def test_template_validator_accepts_allowed_variables_and_loop_items(tmp_path):
    path = tmp_path / "template.docx"
    _create_docx(
        path,
        [
            "{{ candidate.full_name }}",
            "{{ skills.primary_text }}",
            "{%p for project in experience %}",
            "{{ project.project_name }}",
            "{{ project.stack_text }}",
            "{%p for task in project.responsibilities %}",
            "{{ task }}",
            "{%p endfor %}",
            "{%p endfor %}",
        ],
    )

    schema = PartnerTemplateFileValidator().validate_template_variables(path)

    assert schema["version"] == "1.0"
    assert schema["variables"] == [
        "candidate.full_name",
        "experience",
        "experience.project_name",
        "experience.responsibilities",
        "experience.stack_text",
        "skills.primary_text",
    ]


def test_template_validator_rejects_unknown_variable(tmp_path):
    path = tmp_path / "template.docx"
    _create_docx(path, ["{{ candidate.birth_date }}"])

    with pytest.raises(AppError) as exc_info:
        PartnerTemplateFileValidator().validate_template_variables(path)

    assert exc_info.value.code == "template.unknown_variable"
    assert exc_info.value.message == "Шаблон содержит неизвестное поле: candidate.birth_date"


def test_template_validator_rejects_template_without_variables(tmp_path):
    path = tmp_path / "template.docx"
    _create_docx(path, ["Документ без шаблонных переменных"])

    with pytest.raises(AppError) as exc_info:
        PartnerTemplateFileValidator().validate_template_variables(path)

    assert exc_info.value.code == "template.invalid"
