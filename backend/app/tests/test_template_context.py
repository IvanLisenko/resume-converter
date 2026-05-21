from app.documents.template_context import TemplateContextMapper
from app.schemas.resume import (
    ResumeCandidate,
    ResumeData,
    ResumeEducationItem,
    ResumeExperienceItem,
    ResumeSkills,
)


def test_template_context_mapper_builds_docxtpl_context():
    resume = ResumeData(
        candidate=ResumeCandidate(
            full_name="Иван Иванов Иванович",
            position="Java Developer",
            level="Senior",
            location="Москва",
            available_from="с 01.06.2026",
        ),
        skills=ResumeSkills(
            primary=["Java", "Spring"],
            detailed=["REST API", "PostgreSQL"],
        ),
        summary="Опытный backend-разработчик.",
        education=[
            ResumeEducationItem(
                raw="Балтийский федеральный университет имени Иммануила Канта, "
                "Информационные системы, разработчик (2014)"
            )
        ],
        experience=[
            ResumeExperienceItem(
                title="Senior Java Developer",
                project_name="финтех",
                stack_text="Java, Spring Boot",
                stack=["Java", "Spring Boot"],
            )
        ],
        extra={"checklist_text": "Проверено рекрутером"},
    )

    context = TemplateContextMapper().map_resume(resume)

    assert context["candidate"]["full_name"] == "Иван Иванов Иванович"
    assert context["skills"]["primary_text"] == "Java, Spring"
    assert context["skills"]["detailed_text"] == "REST API\nPostgreSQL"
    assert context["education"][0]["university"] == (
        "Балтийский федеральный университет имени Иммануила Канта"
    )
    assert context["education"][0]["end_year"] == "2014"
    assert context["experience"][0]["stack_text"] == "Java, Spring Boot"
    assert context["checklist_text"] == "Проверено рекрутером"
    assert context["employment"]["period"] == "с 01.06.2026"
