from dataclasses import dataclass


@dataclass(frozen=True)
class TemplateVariable:
    path: str
    description: str


class TemplateVariableCatalog:
    version = "1.0"

    variables = (
        TemplateVariable("candidate.full_name", "ФИО кандидата"),
        TemplateVariable("candidate.position", "Желаемая позиция"),
        TemplateVariable("candidate.level", "Уровень кандидата"),
        TemplateVariable("candidate.location", "Локация кандидата"),
        TemplateVariable("candidate.available_from", "Дата выхода на проект"),
        TemplateVariable("candidate.total_experience", "Общий опыт работы"),
        TemplateVariable("candidate.role_title", "Уровень и позиция одной строкой"),
        TemplateVariable("candidate.position_line", "Готовая строка с позицией"),
        TemplateVariable("candidate.level_line", "Готовая строка с уровнем"),
        TemplateVariable("candidate.location_line", "Готовая строка с локацией"),
        TemplateVariable("candidate.available_from_line", "Готовая строка с датой выхода"),
        TemplateVariable("candidate.total_experience_line", "Готовая строка с общим опытом"),
        TemplateVariable("summary", "Блок о кандидате"),
        TemplateVariable("summary_paragraphs", "Блок о кандидате по абзацам"),
        TemplateVariable("has_summary", "Признак наличия блока о кандидате"),
        TemplateVariable("summary_heading", "Заголовок блока о кандидате"),
        TemplateVariable("skills.primary", "Основные навыки списком"),
        TemplateVariable("skills.primary_text", "Основные навыки одной строкой"),
        TemplateVariable("skills.detailed", "Детальные навыки списком"),
        TemplateVariable("skills.detailed_text", "Детальные навыки текстом"),
        TemplateVariable(
            "skills.programming_languages_text",
            "Навыки языков программирования одной строкой",
        ),
        TemplateVariable("skills.tools_text", "Инструменты и технологии одной строкой"),
        TemplateVariable("skills.databases_text", "Базы данных одной строкой"),
        TemplateVariable("skills.other_text", "Прочие навыки одной строкой"),
        TemplateVariable("has_skills", "Признак наличия любых навыков"),
        TemplateVariable("has_primary_skills", "Признак наличия основного стека"),
        TemplateVariable("has_detailed_skills", "Признак наличия детальных навыков"),
        TemplateVariable("skills_heading", "Заголовок блока навыков"),
        TemplateVariable("education", "Образование списком"),
        TemplateVariable("has_education", "Признак наличия образования"),
        TemplateVariable("education_heading", "Заголовок блока образования"),
        TemplateVariable("languages", "Языки списком"),
        TemplateVariable("has_languages", "Признак наличия языков"),
        TemplateVariable("languages_heading", "Заголовок блока языков"),
        TemplateVariable("experience", "Опыт работы списком"),
        TemplateVariable("has_experience", "Признак наличия опыта работы"),
        TemplateVariable("experience_heading", "Заголовок блока опыта работы"),
        TemplateVariable("recent_projects_heading", "Заголовок блока недавних проектов"),
        TemplateVariable("checklist_text", "Текст чек-листа для партнёрского шаблона"),
        TemplateVariable("checklist_items", "Строки чек-листа для партнёрского шаблона"),
        TemplateVariable("has_checklist", "Признак наличия чек-листа"),
        TemplateVariable("checklist_heading", "Заголовок блока чек-листа"),
        TemplateVariable("employment.period", "Период выхода на проект"),
    )

    loop_item_variables = {
        "education": {
            "raw",
            "university",
            "program",
            "period",
            "start_year",
            "end_year",
        },
        "checklist_items": {
            "requirement",
            "status",
            "comment",
        },
        "languages": {
            "name",
            "level",
        },
        "experience": {
            "title",
            "role",
            "level",
            "role_title",
            "project_name",
            "project_heading",
            "period",
            "description",
            "responsibilities",
            "achievements",
            "team",
            "stack",
            "stack_text",
            "stack_line",
            "has_description",
            "has_responsibilities",
            "has_achievements",
            "has_stack",
            "has_team",
            "description_heading",
            "responsibilities_heading",
            "achievements_heading",
            "team_heading",
            "team_line",
        },
    }

    @classmethod
    def allowed_paths(cls) -> set[str]:
        return {variable.path for variable in cls.variables}

    @classmethod
    def schema(cls, used_variables: set[str]) -> dict[str, object]:
        return {
            "version": cls.version,
            "variables": sorted(used_variables),
            "available_variables": [
                {
                    "path": variable.path,
                    "description": variable.description,
                }
                for variable in cls.variables
            ],
        }
