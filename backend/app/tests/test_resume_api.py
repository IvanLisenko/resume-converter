from uuid import uuid4

from docx import Document
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.main import create_app
from app.models.enums import UserRole
from app.models.user import User
from app.services.operation_log_service import OperationLogService


def _create_trive_docx(path) -> None:
    document = Document()
    for paragraph in [
        "Иван Иванов Иванович",
        "Java Developer",
        "Опыт работы: 5 лет",
        "Навыки",
        "Java, Spring, PostgreSQL",
        "- REST API",
        "О себе",
        "Опытный Java-разработчик.",
        "Образование",
        "МГУ, Прикладная информатика (2015)",
        "Знание языков",
        "Русский — родной",
        "Опыт работы",
        "Senior Java Developer на проекте в сфере финтех",
        "(январь 2020 — май 2024) — 4 года 5 месяцев",
        "Описание проекта: Платформа обработки платежей",
        "Задачи: Разработка backend-сервисов",
        "Достижения: ускорил обработку платежей",
        "Команда проекта: 4 backend, 2 QA",
        "Стек: Java, Spring Framework (Spring Boot, Web), PostgreSQL",
    ]:
        document.add_paragraph(paragraph)
    document.save(path)


def test_extract_resume_api_returns_unified_resume_model(tmp_path, monkeypatch):
    app = create_app()

    async def skip_operation_log(*args, **kwargs) -> None:
        return None

    monkeypatch.setattr(OperationLogService, "log", skip_operation_log)

    async def override_current_user() -> User:
        return User(
            id=uuid4(),
            email="recruiter@example.com",
            full_name="Тестовый рекрутер",
            password_hash="hash",
            role=UserRole.RECRUITER,
            is_active=True,
        )

    app.dependency_overrides[get_current_user] = override_current_user
    client = TestClient(app)

    path = tmp_path / "resume.docx"
    _create_trive_docx(path)

    response = client.post(
        "/api/v1/resumes/extract",
        files={
            "file": (
                "resume.docx",
                path.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["resume"]["candidate"]["full_name"] == "Иван Иванов Иванович"
    assert payload["resume"]["skills"]["primary"] == ["Java", "Spring", "PostgreSQL"]
    assert payload["resume"]["experience"][0]["stack_text"] == (
        "Java, Spring Framework (Spring Boot, Web), PostgreSQL"
    )
    assert payload["warnings"] == [
        "не найдены контакты",
        "не найдена локация",
        "не найдена дата выхода на проект",
    ]
    assert payload["source"]["filename"] == "resume.docx"
    assert payload["source"]["sizeBytes"] == path.stat().st_size
    assert "size_bytes" not in payload["source"]
