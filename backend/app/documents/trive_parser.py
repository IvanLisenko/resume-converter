import re
from dataclasses import dataclass
from pathlib import Path

from docx import Document
from docx.opc.exceptions import PackageNotFoundError

from app.core.errors import AppError
from app.schemas.resume import (
    ResumeCandidate,
    ResumeContacts,
    ResumeData,
    ResumeEducationItem,
    ResumeExperienceItem,
    ResumeLanguageItem,
    ResumeSkills,
)

SECTION_HEADERS = {
    "Навыки": "skills",
    "О себе": "summary",
    "Образование": "education",
    "Знание языков": "languages",
    "Опыт работы": "experience",
}
REQUIRED_HEADERS = {"Навыки", "О себе", "Образование", "Знание языков", "Опыт работы"}
EXPERIENCE_MARKERS = {
    "Описание проекта": "description",
    "Задачи": "responsibilities",
    "Достижения": "achievements",
    "Команда проекта": "team",
    "Стек": "stack",
}
LEVEL_PATTERN = re.compile(
    r"\b(senior\+?|middle\+?|junior\+?|lead|team\s*lead|tech\s*lead|principal|architect)\b",
    flags=re.IGNORECASE,
)


@dataclass(frozen=True)
class TriveParseResult:
    resume: ResumeData
    warnings: list[str]


class TriveResumeParser:
    def parse(self, path: str | Path) -> TriveParseResult:
        lines = self._read_lines(path)
        sections = self._split_sections(lines)
        warnings = self._build_format_warnings(sections)

        candidate = self._parse_candidate(sections["header"], warnings)
        experience = self._parse_experience(sections["experience"])
        self._enrich_candidate_from_experience(candidate, experience)
        resume = ResumeData(
            candidate=candidate,
            contacts=ResumeContacts(),
            skills=self._parse_skills(sections["skills"]),
            summary=self._parse_summary(sections["summary"]),
            education=self._parse_education(sections["education"]),
            languages=self._parse_languages(sections["languages"]),
            experience=experience,
        )
        self._append_data_warnings(resume, warnings)

        return TriveParseResult(resume=resume, warnings=warnings)

    def _read_lines(self, path: str | Path) -> list[str]:
        try:
            document = Document(path)
        except PackageNotFoundError as exc:
            raise AppError(
                code="resume.invalid_format",
                message="Файл должен быть корректным .docx документом",
                status_code=400,
            ) from exc
        except Exception as exc:
            raise AppError(
                code="resume.extraction_failed",
                message="Не удалось прочитать .docx файл",
                status_code=400,
            ) from exc

        lines: list[str] = []
        for paragraph in document.paragraphs:
            text = self._normalize_text(paragraph.text)
            if text:
                lines.append(text)
        return lines

    def _split_sections(self, lines: list[str]) -> dict[str, list[str]]:
        found_headers = REQUIRED_HEADERS.intersection(lines)
        if found_headers != REQUIRED_HEADERS:
            raise AppError(
                code="resume.trive_format_not_detected",
                message="Файл не похож на резюме в формате ТРАЙВ",
                details={"missing_sections": sorted(REQUIRED_HEADERS - found_headers)},
                status_code=400,
            )

        sections: dict[str, list[str]] = {
            "header": [],
            "skills": [],
            "summary": [],
            "education": [],
            "languages": [],
            "experience": [],
        }
        current_section = "header"

        for line in lines:
            section = SECTION_HEADERS.get(line)
            if section is not None:
                current_section = section
                continue
            sections[current_section].append(line)

        return sections

    def _parse_candidate(self, lines: list[str], warnings: list[str]) -> ResumeCandidate:
        full_name = lines[0] if len(lines) > 0 else None
        position = lines[1] if len(lines) > 1 else None
        total_experience = None

        if len(lines) > 2:
            match = re.search(r"Опыт работы:\s*(.+)", lines[2], flags=re.IGNORECASE)
            total_experience = match.group(1).strip() if match else lines[2]

        if full_name and len(full_name.split()) < 3:
            warnings.append("не найдено полное ФИО")

        return ResumeCandidate(
            full_name=full_name,
            position=position,
            total_experience=total_experience,
        )

    def _parse_skills(self, lines: list[str]) -> ResumeSkills:
        primary: list[str] = []
        detailed: list[str] = []

        for index, line in enumerate(lines):
            if index == 0 and not line.startswith("-"):
                primary = self._split_comma_list(line)
                continue
            if line.startswith("-") or not detailed:
                detailed.append(line.removeprefix("-").strip())
                continue
            detailed[-1] = f"{detailed[-1]} {line}".strip()

        return ResumeSkills(primary=primary, detailed=[item for item in detailed if item])

    def _parse_summary(self, lines: list[str]) -> str | None:
        return "\n\n".join(lines) if lines else None

    def _parse_education(self, lines: list[str]) -> list[ResumeEducationItem]:
        return [ResumeEducationItem(raw=line) for line in lines]

    def _parse_languages(self, lines: list[str]) -> list[ResumeLanguageItem]:
        languages: list[ResumeLanguageItem] = []
        for line in lines:
            parts = [part.strip() for part in re.split(r"\s+[—-]\s+", line, maxsplit=1)]
            languages.append(
                ResumeLanguageItem(
                    name=parts[0],
                    level=parts[1] if len(parts) > 1 else None,
                )
            )
        return languages

    def _parse_experience(self, lines: list[str]) -> list[ResumeExperienceItem]:
        blocks = self._split_experience_blocks(lines)
        return [self._parse_experience_block(block) for block in blocks]

    def _split_experience_blocks(self, lines: list[str]) -> list[list[str]]:
        blocks: list[list[str]] = []
        current_block: list[str] = []

        for index, line in enumerate(lines):
            next_line = lines[index + 1] if index + 1 < len(lines) else ""
            starts_new_block = bool(current_block) and self._looks_like_position_header(
                line,
                next_line,
            )
            if starts_new_block:
                blocks.append(current_block)
                current_block = []
            current_block.append(line)

        if current_block:
            blocks.append(current_block)

        return blocks

    def _parse_experience_block(self, lines: list[str]) -> ResumeExperienceItem:
        title = lines[0]
        period = lines[1] if len(lines) > 1 and self._looks_like_period(lines[1]) else None
        role = self._extract_role(title)
        item = ResumeExperienceItem(
            title=title,
            role=role,
            level=self._extract_level(role or title),
            project_name=self._extract_project_name(title),
            period=period,
        )

        current_marker: str | None = None
        start_index = 2 if period else 1

        for line in lines[start_index:]:
            marker, value = self._extract_marker(line)
            if marker is not None:
                current_marker = marker
                if value:
                    self._append_experience_value(item, marker, value)
                continue

            if current_marker is not None:
                self._append_experience_value(item, current_marker, line)

        return item

    def _append_experience_value(self, item: ResumeExperienceItem, marker: str, value: str) -> None:
        if marker == "description":
            item.description = self._join_text(item.description, value)
        elif marker == "responsibilities":
            item.responsibilities.append(value)
        elif marker == "achievements":
            item.achievements.append(value.removesuffix(",").strip())
        elif marker == "team":
            item.team = self._join_text(item.team, value)
        elif marker == "stack":
            item.stack_text = self._join_inline_text(item.stack_text, value)
            item.stack.extend(self._split_stack_list(value))

    def _extract_marker(self, line: str) -> tuple[str | None, str | None]:
        for marker_text, marker_key in EXPERIENCE_MARKERS.items():
            pattern = rf"^{re.escape(marker_text)}\s*:?\s*(.*)$"
            match = re.match(pattern, line, flags=re.IGNORECASE)
            if match:
                return marker_key, match.group(1).strip() or None
        return None, None

    def _build_format_warnings(self, sections: dict[str, list[str]]) -> list[str]:
        warnings = []
        for section_name in ("skills", "summary", "education", "languages", "experience"):
            if not sections[section_name]:
                warnings.append(f"секция {section_name} не содержит данных")
        return warnings

    def _append_data_warnings(self, resume: ResumeData, warnings: list[str]) -> None:
        if not resume.contacts.email and not resume.contacts.phone and not resume.contacts.telegram:
            warnings.append("не найдены контакты")
        if not resume.candidate.location:
            warnings.append("не найдена локация")
        if not resume.candidate.available_from:
            warnings.append("не найдена дата выхода на проект")
        if not resume.experience:
            warnings.append("не найден опыт работы")

    @staticmethod
    def _normalize_text(value: str) -> str:
        return re.sub(r"\s+", " ", value.replace("\n", " ")).strip()

    @staticmethod
    def _split_comma_list(value: str) -> list[str]:
        return [item.strip() for item in value.split(",") if item.strip()]

    @staticmethod
    def _split_stack_list(value: str) -> list[str]:
        items: list[str] = []
        buffer: list[str] = []
        depth = 0

        for char in value:
            if char == "(":
                depth += 1
            elif char == ")" and depth > 0:
                depth -= 1

            if char == "," and depth == 0:
                item = "".join(buffer).strip()
                if item:
                    items.append(item)
                buffer = []
                continue

            buffer.append(char)

        last_item = "".join(buffer).strip().removesuffix(".").strip()
        if last_item:
            items.append(last_item)

        return items

    @staticmethod
    def _looks_like_period(value: str) -> bool:
        return value.startswith("(") and "—" in value

    @classmethod
    def _looks_like_position_header(cls, line: str, next_line: str) -> bool:
        return not line.startswith("(") and cls._looks_like_period(next_line)

    @staticmethod
    def _extract_project_name(title: str) -> str | None:
        match = re.search(r"на проекте\s+(.+)$", title, flags=re.IGNORECASE)
        return match.group(1).strip() if match else title

    @staticmethod
    def _extract_role(title: str) -> str | None:
        role = re.split(r"\s+на проекте\s+", title, maxsplit=1, flags=re.IGNORECASE)[0].strip()
        return role or None

    @staticmethod
    def _extract_level(value: str) -> str | None:
        match = LEVEL_PATTERN.search(value)
        if not match:
            return None
        level = re.sub(r"\s+", " ", match.group(1)).strip()
        aliases = {
            "team lead": "Team Lead",
            "tech lead": "Tech Lead",
        }
        return aliases.get(level.lower(), level[:1].upper() + level[1:])

    @staticmethod
    def _enrich_candidate_from_experience(
        candidate: ResumeCandidate,
        experience: list[ResumeExperienceItem],
    ) -> None:
        if not experience:
            return

        current_experience = experience[0]
        if not candidate.level and current_experience.level:
            candidate.level = current_experience.level
        if not candidate.position and current_experience.role:
            candidate.position = current_experience.role

    @staticmethod
    def _join_text(current: str | None, value: str) -> str:
        return value if not current else f"{current}\n{value}"

    @staticmethod
    def _join_inline_text(current: str | None, value: str) -> str:
        return value if not current else f"{current} {value}"
