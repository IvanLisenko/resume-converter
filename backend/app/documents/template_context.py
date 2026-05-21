import re
from typing import Any

from pydantic import BaseModel

from app.schemas.resume import ResumeData, ResumeEducationItem, ResumeExperienceItem


class TemplateContextMapper:
    def map_resume(self, resume: ResumeData) -> dict[str, Any]:
        candidate = self._map_candidate(resume)
        checklist_text = str(resume.extra.get("checklist_text") or "").strip()
        primary_skills = resume.skills.primary
        detailed_skills = resume.skills.detailed
        has_primary_skills = bool(primary_skills)
        has_detailed_skills = bool(detailed_skills)
        context = {
            "candidate": candidate,
            "summary": resume.summary or "",
            "summary_paragraphs": self._split_paragraphs(resume.summary),
            "has_summary": self._has_text(resume.summary),
            "summary_heading": (
                "Сопроводительное письмо (О себе, знания и навыки)"
                if self._has_text(resume.summary)
                else ""
            ),
            "skills": {
                "primary": primary_skills,
                "primary_text": ", ".join(primary_skills),
                "detailed": detailed_skills,
                "detailed_text": "\n".join(detailed_skills),
            },
            "education": [self._map_education(item) for item in resume.education],
            "languages": [item.model_dump() for item in resume.languages],
            "experience": [self._map_experience(item) for item in resume.experience],
            "has_skills": has_primary_skills or has_detailed_skills,
            "has_primary_skills": has_primary_skills,
            "has_detailed_skills": has_detailed_skills,
            "skills_heading": (
                "Ключевые навыки (Основной стек)"
                if has_primary_skills or has_detailed_skills
                else ""
            ),
            "has_education": bool(resume.education),
            "education_heading": "Образование" if resume.education else "",
            "has_languages": bool(resume.languages),
            "languages_heading": "Знание языков" if resume.languages else "",
            "has_experience": bool(resume.experience),
            "experience_heading": "Опыт работы" if resume.experience else "",
            "recent_projects_heading": "Недавние проекты" if resume.experience else "",
            "checklist_text": checklist_text,
            "has_checklist": bool(checklist_text),
            "checklist_heading": "Чек-лист" if checklist_text else "",
            "employment": {
                "period": resume.candidate.available_from or "",
            },
        }
        return self._clean_empty_values(context)

    def _map_candidate(self, resume: ResumeData) -> dict[str, Any]:
        candidate = resume.candidate.model_dump()
        role_title = " ".join(
            item
            for item in [
                resume.candidate.level,
                resume.candidate.position,
            ]
            if item
        )
        candidate.update(
            {
                "role_title": role_title,
                "position_line": self._format_labeled_line(
                    "Позиция",
                    resume.candidate.position,
                ),
                "level_line": self._format_labeled_line("Уровень", resume.candidate.level),
                "location_line": self._format_labeled_line(
                    "Локация",
                    resume.candidate.location,
                ),
                "available_from_line": self._format_available_from_line(
                    resume.candidate.available_from,
                ),
            }
        )
        return candidate

    def _map_education(self, item: ResumeEducationItem) -> dict[str, str | None]:
        parsed = self._parse_education_raw(item.raw)
        return {
            "raw": item.raw,
            "university": parsed.get("university"),
            "program": parsed.get("program"),
            "period": parsed.get("period"),
            "start_year": parsed.get("start_year"),
            "end_year": parsed.get("end_year"),
        }

    @staticmethod
    def _map_experience(item: ResumeExperienceItem) -> dict[str, Any]:
        data = item.model_dump()
        data.update(
            {
                "role_title": item.role or item.title,
                "project_heading": TemplateContextMapper._format_project_heading(
                    item.project_name,
                ),
                "stack_line": TemplateContextMapper._format_labeled_line(
                    "Набор использованных технологий",
                    item.stack_text,
                ),
                "has_description": bool(item.description),
                "has_responsibilities": bool(item.responsibilities),
                "has_achievements": bool(item.achievements),
                "has_stack": bool(item.stack_text or item.stack),
                "has_team": bool(item.team),
                "description_heading": "Описание проекта" if item.description else "",
                "responsibilities_heading": (
                    "Что было сделано" if item.responsibilities else ""
                ),
                "achievements_heading": "Достижения:" if item.achievements else "",
                "team_heading": "Команда проекта" if item.team else "",
                "team_line": TemplateContextMapper._format_labeled_line(
                    "Команда проекта",
                    item.team,
                ),
            }
        )
        return data

    @staticmethod
    def _parse_education_raw(raw: str) -> dict[str, str | None]:
        years = re.findall(r"\b(?:19|20)\d{2}\b", raw)
        without_years = re.sub(r"\s*\((?:19|20)\d{2}\)\s*$", "", raw).strip()
        parts = [part.strip() for part in without_years.split(",") if part.strip()]

        start_year = years[0] if len(years) > 1 else None
        end_year = years[-1] if years else None

        return {
            "university": parts[0] if parts else raw,
            "program": ", ".join(parts[1:]) if len(parts) > 1 else None,
            "period": TemplateContextMapper._format_period(start_year, end_year),
            "start_year": start_year,
            "end_year": end_year,
        }

    @staticmethod
    def _format_period(start: str | None, end: str | None) -> str | None:
        if start and end:
            return f"{start} — {end}"
        return start or end

    @staticmethod
    def _format_labeled_line(label: str, value: str | None) -> str:
        return f"{label}: {value}" if value else ""

    @staticmethod
    def _format_project_heading(value: str | None) -> str:
        if not value:
            return ""
        if value.strip().lower().startswith("проект"):
            return value
        return f"Проект {value}"

    @staticmethod
    def _format_available_from_line(value: str | None) -> str:
        if not value:
            return ""
        prefix = "Готов(-а) выйти на проект"
        if value.strip().lower().startswith("с "):
            return f"{prefix} {value}"
        return f"{prefix} с {value}"

    @staticmethod
    def _has_text(value: str | None) -> bool:
        return bool(value and value.strip())

    @staticmethod
    def _split_paragraphs(value: str | None) -> list[str]:
        if not value:
            return []
        return [paragraph.strip() for paragraph in re.split(r"\n{2,}", value) if paragraph.strip()]

    @classmethod
    def _clean_empty_values(cls, value: Any) -> Any:
        if value is None:
            return ""
        if isinstance(value, BaseModel):
            return cls._clean_empty_values(value.model_dump())
        if isinstance(value, list):
            return [cls._clean_empty_values(item) for item in value]
        if isinstance(value, dict):
            return {key: cls._clean_empty_values(item) for key, item in value.items()}
        return value


def dump_template_context_value(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return value.model_dump()
    if isinstance(value, list):
        return [dump_template_context_value(item) for item in value]
    if isinstance(value, dict):
        return {key: dump_template_context_value(item) for key, item in value.items()}
    return value
