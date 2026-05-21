from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.documents.template_variables import TemplateVariableCatalog
from app.models.user import User
from app.schemas.template_variables import (
    TemplateVariableCatalogResponse,
    TemplateVariableResponse,
)

router = APIRouter(prefix="/template-variables", tags=["template-variables"])


@router.get("", response_model=TemplateVariableCatalogResponse)
async def get_template_variables(
    current_user: Annotated[User, Depends(get_current_user)],
) -> TemplateVariableCatalogResponse:
    return TemplateVariableCatalogResponse(
        version=TemplateVariableCatalog.version,
        variables=[
            TemplateVariableResponse(
                path=variable.path,
                description=variable.description,
            )
            for variable in TemplateVariableCatalog.variables
        ],
    )
