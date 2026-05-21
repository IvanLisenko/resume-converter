import pytest
from docx import Document

from app.core.errors import AppError
from app.documents.trive_parser import TriveResumeParser


def _create_docx(path, paragraphs: list[str]) -> None:
    document = Document()
    for paragraph in paragraphs:
        document.add_paragraph(paragraph)
    document.save(path)


def test_trive_parser_extracts_main_sections(tmp_path):
    path = tmp_path / "resume.docx"
    _create_docx(
        path,
        [
            "Иван Иванов Иванович",
            "Java Developer",
            "Опыт работы: 5 лет",
            "Навыки",
            "Java, Spring, PostgreSQL",
            "- REST API",
            "контрактное API для внешних сервисов",
            "- Docker",
            "О себе",
            "Опытный Java-разработчик.",
            "Образование",
            "МГУ, Прикладная информатика (2015)",
            "Знание языков",
            "Русский — родной",
            "Английский — B2",
            "Опыт работы",
            "Senior Java Developer на проекте в сфере финтех",
            "(январь 2020 — май 2024) — 4 года 5 месяцев",
            "Описание проекта: Платформа обработки платежей",
            "Задачи:",
            "Разработка backend-сервисов",
            "Интеграция с внешними API",
            "Достижения:",
            "ускорил обработку платежей",
            "Команда проекта: 4 backend, 2 QA",
            "Стек: Java, Spring Framework (Spring Boot, Web, Security), PostgreSQL",
        ],
    )

    result = TriveResumeParser().parse(path)
    resume = result.resume

    assert resume.candidate.full_name == "Иван Иванов Иванович"
    assert resume.candidate.position == "Java Developer"
    assert resume.candidate.total_experience == "5 лет"
    assert resume.candidate.level == "Senior"
    assert resume.skills.primary == ["Java", "Spring", "PostgreSQL"]
    assert resume.skills.detailed == ["REST API контрактное API для внешних сервисов", "Docker"]
    assert resume.summary == "Опытный Java-разработчик."
    assert resume.education[0].raw == "МГУ, Прикладная информатика (2015)"
    assert resume.languages[1].name == "Английский"
    assert resume.languages[1].level == "B2"
    assert resume.experience[0].project_name == "в сфере финтех"
    assert resume.experience[0].role == "Senior Java Developer"
    assert resume.experience[0].level == "Senior"
    assert resume.experience[0].description == "Платформа обработки платежей"
    assert resume.experience[0].responsibilities == [
        "Разработка backend-сервисов",
        "Интеграция с внешними API",
    ]
    assert resume.experience[0].achievements == ["ускорил обработку платежей"]
    assert resume.experience[0].team == "4 backend, 2 QA"
    assert resume.experience[0].stack_text == (
        "Java, Spring Framework (Spring Boot, Web, Security), PostgreSQL"
    )
    assert resume.experience[0].stack == [
        "Java",
        "Spring Framework (Spring Boot, Web, Security)",
        "PostgreSQL",
    ]


def test_trive_parser_rejects_document_without_required_sections(tmp_path):
    path = tmp_path / "not-trive.docx"
    _create_docx(path, ["Просто документ", "Без нужных секций"])

    with pytest.raises(AppError) as exc_info:
        TriveResumeParser().parse(path)

    assert exc_info.value.code == "resume.trive_format_not_detected"
