from pydantic import BaseModel


class TemplateVariableResponse(BaseModel):
    path: str
    description: str


class TemplateVariableCatalogResponse(BaseModel):
    version: str
    variables: list[TemplateVariableResponse]
