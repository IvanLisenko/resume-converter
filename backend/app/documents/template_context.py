import re
from typing import Any

from pydantic import BaseModel

from app.schemas.resume import ResumeData, ResumeEducationItem


class TemplateContextMapper:
    def map_resume(self, resume: ResumeData) -> dict[str, Any]:
        return {
            "candidate": resume.candidate.model_dump(),
            "summary": resume.summary or "",
            "skills": {
                "primary": resume.skills.primary,
                "primary_text": ", ".join(resume.skills.primary),
                "detailed": resume.skills.detailed,
                "detailed_text": "\n".join(resume.skills.detailed),
            },
            "education": [self._map_education(item) for item in resume.education],
            "languages": [item.model_dump() for item in resume.languages],
            "experience": [item.model_dump() for item in resume.experience],
            "checklist_text": str(resume.extra.get("checklist_text") or ""),
            "employment": {
                "period": resume.candidate.available_from or "",
            },
        }

    def _map_education(self, item: ResumeEducationItem) -> dict[str, str | None]:
        parsed = self._parse_education_raw(item.raw)
        return {
            "raw": item.raw,
            "university": parsed.get("university"),
            "program": parsed.get("program"),
            "start_year": parsed.get("start_year"),
            "end_year": parsed.get("end_year"),
        }

    @staticmethod
    def _parse_education_raw(raw: str) -> dict[str, str | None]:
        years = re.findall(r"\b(?:19|20)\d{2}\b", raw)
        without_years = re.sub(r"\s*\((?:19|20)\d{2}\)\s*$", "", raw).strip()
        parts = [part.strip() for part in without_years.split(",") if part.strip()]

        return {
            "university": parts[0] if parts else raw,
            "program": ", ".join(parts[1:]) if len(parts) > 1 else None,
            "start_year": years[0] if len(years) > 1 else None,
            "end_year": years[-1] if years else None,
        }


def dump_template_context_value(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return value.model_dump()
    if isinstance(value, list):
        return [dump_template_context_value(item) for item in value]
    if isinstance(value, dict):
        return {key: dump_template_context_value(item) for key, item in value.items()}
    return value
