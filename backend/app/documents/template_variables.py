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
        TemplateVariable("summary", "Блок о кандидате"),
        TemplateVariable("skills.primary", "Основные навыки списком"),
        TemplateVariable("skills.primary_text", "Основные навыки одной строкой"),
        TemplateVariable("skills.detailed", "Детальные навыки списком"),
        TemplateVariable("skills.detailed_text", "Детальные навыки текстом"),
        TemplateVariable("education", "Образование списком"),
        TemplateVariable("languages", "Языки списком"),
        TemplateVariable("experience", "Опыт работы списком"),
        TemplateVariable("checklist_text", "Текст чек-листа для партнёрского шаблона"),
        TemplateVariable("employment.period", "Период выхода на проект"),
    )

    loop_item_variables = {
        "education": {
            "raw",
            "university",
            "program",
            "start_year",
            "end_year",
        },
        "languages": {
            "name",
            "level",
        },
        "experience": {
            "title",
            "project_name",
            "period",
            "description",
            "responsibilities",
            "achievements",
            "team",
            "stack",
            "stack_text",
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
