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
            total_experience="5 лет",
            level="Senior",
            location="Москва",
            available_from="с 01.06.2026",
        ),
        skills=ResumeSkills(
            primary=["Java", "Spring"],
            detailed=["REST API", "PostgreSQL"],
        ),
        summary="Опытный backend-разработчик.\n\nУмеет работать с высоконагруженными системами.",
        education=[
            ResumeEducationItem(
                raw="Балтийский федеральный университет имени Иммануила Канта, "
                "Информационные системы, разработчик (2014)"
            )
        ],
        experience=[
            ResumeExperienceItem(
                title="Senior Java Developer",
                role="Senior Java Developer",
                level="Senior",
                project_name="финтех",
                stack_text="Java, Spring Boot",
                stack=["Java", "Spring Boot"],
            )
        ],
        extra={
            "checklist_items": [
                {
                    "requirement": "Java",
                    "status": "соответствует",
                    "comment": "Коммерческий опыт",
                }
            ]
        },
    )

    context = TemplateContextMapper().map_resume(resume)

    assert context["candidate"]["full_name"] == "Иван Иванов Иванович"
    assert context["candidate"]["role_title"] == "Senior Java Developer"
    assert context["candidate"]["level_line"] == "Уровень: Senior"
    assert context["candidate"]["total_experience_line"] == "Опыт работы: 5 лет"
    assert context["candidate"]["available_from_line"] == "Готов(-а) выйти на проект с 01.06.2026"
    assert context["has_summary"] is True
    assert context["summary_heading"] == "Сопроводительное письмо (О себе, знания и навыки)"
    assert context["summary_paragraphs"] == [
        "Опытный backend-разработчик.",
        "Умеет работать с высоконагруженными системами.",
    ]
    assert context["has_skills"] is True
    assert context["skills_heading"] == "Ключевые навыки (Основной стек)"
    assert context["skills"]["primary_text"] == "Java, Spring"
    assert context["skills"]["detailed_text"] == "REST API\nPostgreSQL"
    assert context["skills"]["programming_languages_text"] == "Java"
    assert context["skills"]["tools_text"] == "Spring"
    assert context["skills"]["databases_text"] == ""
    assert context["has_education"] is True
    assert context["education_heading"] == "Образование"
    assert context["education"][0]["university"] == (
        "Балтийский федеральный университет имени Иммануила Канта"
    )
    assert context["education"][0]["end_year"] == "2014"
    assert context["education"][0]["period"] == "2014"
    assert context["experience"][0]["stack_text"] == "Java, Spring Boot"
    assert context["experience"][0]["role_title"] == "Senior Java Developer"
    assert context["experience"][0]["project_heading"] == "Проект финтех"
    assert context["experience"][0]["stack_line"] == (
        "Набор использованных технологий: Java, Spring Boot"
    )
    assert context["experience"][0]["has_achievements"] is False
    assert context["experience"][0]["achievements_heading"] == ""
    assert context["experience"][0]["has_team"] is False
    assert context["experience"][0]["team_line"] == ""
    assert context["checklist_items"] == [
        {
            "requirement": "Java",
            "status": "соответствует",
            "comment": "Коммерческий опыт",
        }
    ]
    assert context["has_checklist"] is True
    assert context["checklist_heading"] == "Чек-лист"
    assert context["employment"]["period"] == "с 01.06.2026"


def test_template_context_mapper_does_not_expose_none_values():
    resume = ResumeData(
        candidate=ResumeCandidate(
            full_name="Виктор Т.",
            position="Java Developer",
        ),
        education=[
            ResumeEducationItem(
                raw="Балтийский федеральный университет имени Иммануила Канта, "
                "Информационные системы, разработчик (2014)"
            )
        ],
    )

    context = TemplateContextMapper().map_resume(resume)

    assert context["candidate"]["level"] == ""
    assert context["candidate"]["role_title"] == "Java Developer"
    assert context["candidate"]["level_line"] == ""
    assert context["candidate"]["location_line"] == ""
    assert context["candidate"]["available_from_line"] == ""
    assert context["candidate"]["total_experience_line"] == ""
    assert context["candidate"]["location"] == ""
    assert context["candidate"]["available_from"] == ""
    assert context["has_summary"] is False
    assert context["summary_heading"] == ""
    assert context["summary_paragraphs"] == []
    assert context["has_checklist"] is False
    assert context["checklist_items"] == []
    assert context["checklist_heading"] == ""
    assert context["has_skills"] is False
    assert context["skills_heading"] == ""
    assert context["has_languages"] is False
    assert context["languages_heading"] == ""
    assert context["has_experience"] is False
    assert context["experience_heading"] == ""
    assert context["recent_projects_heading"] == ""
    assert context["education"][0]["start_year"] == ""
    assert context["education"][0]["end_year"] == "2014"
