import re
from html import unescape
from pathlib import Path
from zipfile import ZipFile

from docx import Document
from docx.opc.exceptions import PackageNotFoundError

from app.core.errors import AppError
from app.documents.template_variables import TemplateVariableCatalog


class TemplateVariableExtractor:
    tag_pattern = re.compile(r"\{[{%#].*?[}%#]\}")
    xml_tag_pattern = re.compile(r"<[^>]+>")
    ignored_tokens = {
        "and",
        "or",
        "not",
        "is",
        "none",
        "None",
        "true",
        "false",
        "True",
        "False",
    }

    def extract(self, path: str | Path) -> set[str]:
        text = self._read_document_xml(path)
        tags = self.tag_pattern.findall(text)
        loop_sources = self._extract_loop_sources(tags)
        variables: set[str] = set()

        for tag in tags:
            content = self._normalize_tag_content(tag)
            if content.startswith(("for ", "endfor", "if ", "endif", "else", "elif ")):
                for variable in self._extract_expression_variables(content, loop_sources):
                    variables.add(variable)
                continue

            for variable in self._extract_expression_variables(content, loop_sources):
                variables.add(variable)

        return variables

    def _read_document_xml(self, path: str | Path) -> str:
        try:
            with ZipFile(path) as archive:
                xml_parts = [
                    archive.read(name).decode("utf-8", errors="ignore")
                    for name in archive.namelist()
                    if name.startswith("word/") and name.endswith(".xml")
                ]
        except Exception as exc:
            raise AppError(
                code="template.invalid",
                message="Не удалось прочитать содержимое .docx шаблона",
                status_code=400,
            ) from exc

        return unescape(self.xml_tag_pattern.sub("", "\n".join(xml_parts)))

    @classmethod
    def _extract_loop_sources(cls, tags: list[str]) -> dict[str, str]:
        loop_sources: dict[str, str] = {}
        for tag in tags:
            content = cls._normalize_tag_content(tag)
            match = re.match(r"for\s+([a-zA-Z_]\w*)\s+in\s+([a-zA-Z_][\w.]*)", content)
            if match:
                loop_sources[match.group(1)] = match.group(2)
        return loop_sources

    @classmethod
    def _extract_expression_variables(
        cls,
        content: str,
        loop_sources: dict[str, str],
    ) -> set[str]:
        if content.startswith("for "):
            match = re.match(r"for\s+[a-zA-Z_]\w*\s+in\s+([a-zA-Z_][\w.]*)", content)
            return {cls._resolve_loop_source(match.group(1), loop_sources)} if match else set()

        content = cls._strip_control_keywords(content)
        variables: set[str] = set()
        for token in re.findall(r"\b[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*", content):
            if token in cls.ignored_tokens:
                continue
            root = token.split(".", maxsplit=1)[0]
            if root in loop_sources:
                variables.add(cls._resolve_loop_token(token, loop_sources))
            elif "." in token or token in TemplateVariableCatalog.allowed_paths():
                variables.add(token)
        return variables

    @staticmethod
    def _normalize_tag_content(tag: str) -> str:
        content = tag.strip()[2:-2].strip()
        if content.startswith(("p ", "tr ", "tc ", "r ")):
            content = content.split(maxsplit=1)[1] if " " in content else ""
        return content.strip()

    @staticmethod
    def _strip_control_keywords(content: str) -> str:
        return re.sub(r"^(if|elif)\s+", "", content).strip()

    @classmethod
    def _resolve_loop_token(cls, token: str, loop_sources: dict[str, str]) -> str:
        root, separator, tail = token.partition(".")
        source = cls._resolve_loop_source(loop_sources[root], loop_sources)
        return f"{source}.{tail}" if separator and tail else source

    @classmethod
    def _resolve_loop_source(cls, source: str, loop_sources: dict[str, str]) -> str:
        root, separator, tail = source.partition(".")
        if root not in loop_sources:
            return source
        resolved_root = cls._resolve_loop_source(loop_sources[root], loop_sources)
        return f"{resolved_root}.{tail}" if separator and tail else resolved_root


class PartnerTemplateFileValidator:
    def __init__(
        self,
        extractor: TemplateVariableExtractor | None = None,
        catalog: type[TemplateVariableCatalog] = TemplateVariableCatalog,
    ) -> None:
        self.extractor = extractor or TemplateVariableExtractor()
        self.catalog = catalog

    def validate_docx(self, path: str | Path) -> None:
        try:
            Document(path)
        except PackageNotFoundError as exc:
            raise AppError(
                code="template.invalid",
                message="Шаблон должен быть корректным .docx документом",
                status_code=400,
            ) from exc
        except Exception as exc:
            raise AppError(
                code="template.invalid",
                message="Не удалось прочитать .docx шаблон",
                status_code=400,
            ) from exc

    def validate_template_variables(self, path: str | Path) -> dict[str, object]:
        used_variables = self.extractor.extract(path)
        if not used_variables:
            raise AppError(
                code="template.invalid",
                message="Шаблон должен содержать хотя бы одну шаблонную переменную",
                status_code=400,
            )

        unknown_variables = self._find_unknown_variables(used_variables)
        if unknown_variables:
            variable = sorted(unknown_variables)[0]
            raise AppError(
                code="template.unknown_variable",
                message=f"Шаблон содержит неизвестное поле: {variable}",
                details={"unknown_variables": sorted(unknown_variables)},
                status_code=400,
            )

        return self.catalog.schema(used_variables)

    def _find_unknown_variables(self, used_variables: set[str]) -> set[str]:
        allowed_paths = self.catalog.allowed_paths()
        unknown_variables: set[str] = set()

        for variable in used_variables:
            root, _, field_path = variable.partition(".")
            if variable in allowed_paths:
                continue
            if root in self.catalog.loop_item_variables and field_path:
                allowed_fields = self.catalog.loop_item_variables[root]
                if field_path.split(".", maxsplit=1)[0] in allowed_fields:
                    continue
            unknown_variables.add(variable)
        return unknown_variables
