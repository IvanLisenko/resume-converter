from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, require_roles
from app.core.errors import AppError
from app.db.session import get_db_session
from app.models.enums import OperationStatus, OperationType, UserRole
from app.models.partner import Partner
from app.models.partner_template import PartnerTemplate
from app.models.user import User
from app.schemas.partners import (
    PartnerCreateRequest,
    PartnerResponse,
    PartnerTemplateResponse,
    PartnerUpdateRequest,
)
from app.services.operation_log_service import OperationLogService
from app.services.partner_service import PartnerService
from app.services.partner_template_service import PartnerTemplateService

router = APIRouter(
    prefix="/partners",
    tags=["partners"],
    dependencies=[Depends(get_current_user)],
)

admin_router = APIRouter(
    prefix="/admin/partners",
    tags=["admin-partners"],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)


@router.get("", response_model=list[PartnerResponse])
async def list_active_partners(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[Partner]:
    return await PartnerService(session).list_active_partners()


@router.get("/{partner_id}", response_model=PartnerResponse)
async def get_active_partner(
    partner_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Partner:
    return await PartnerService(session).get_active_partner(partner_id)


@admin_router.get("", response_model=list[PartnerResponse])
async def list_partners(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[Partner]:
    return await PartnerService(session).list_all_partners()


@admin_router.post("", response_model=PartnerResponse, status_code=201)
async def create_partner(
    payload: PartnerCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Partner:
    current_user_id = current_user.id
    started_at = OperationLogService.start_timer()
    try:
        partner = await PartnerService(session).create_partner(payload)
        await OperationLogService(session).log(
            operation_type=OperationType.CREATE_PARTNER,
            status=OperationStatus.SUCCESS,
            user_id=current_user_id,
            partner_id=partner.id,
            started_at=started_at,
        )
        return partner
    except AppError as exc:
        await session.rollback()
        await OperationLogService(session).log(
            operation_type=OperationType.CREATE_PARTNER,
            status=OperationStatus.FAILED,
            user_id=current_user_id,
            error_code=exc.code,
            started_at=started_at,
        )
        raise


@admin_router.get("/{partner_id}", response_model=PartnerResponse)
async def get_partner(
    partner_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Partner:
    return await PartnerService(session).get_partner(partner_id)


@admin_router.patch("/{partner_id}", response_model=PartnerResponse)
async def update_partner(
    partner_id: UUID,
    payload: PartnerUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Partner:
    current_user_id = current_user.id
    started_at = OperationLogService.start_timer()
    try:
        partner = await PartnerService(session).update_partner(partner_id, payload)
        await OperationLogService(session).log(
            operation_type=OperationType.UPDATE_PARTNER,
            status=OperationStatus.SUCCESS,
            user_id=current_user_id,
            partner_id=partner.id,
            started_at=started_at,
        )
        return partner
    except AppError as exc:
        await session.rollback()
        await OperationLogService(session).log(
            operation_type=OperationType.UPDATE_PARTNER,
            status=OperationStatus.FAILED,
            user_id=current_user_id,
            partner_id=partner_id,
            error_code=exc.code,
            started_at=started_at,
        )
        raise


@admin_router.delete("/{partner_id}", response_model=PartnerResponse)
async def delete_partner(
    partner_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Partner:
    current_user_id = current_user.id
    started_at = OperationLogService.start_timer()
    try:
        partner = await PartnerService(session).deactivate_partner(partner_id)
        await OperationLogService(session).log(
            operation_type=OperationType.UPDATE_PARTNER,
            status=OperationStatus.SUCCESS,
            user_id=current_user_id,
            partner_id=partner.id,
            started_at=started_at,
        )
        return partner
    except AppError as exc:
        await session.rollback()
        await OperationLogService(session).log(
            operation_type=OperationType.UPDATE_PARTNER,
            status=OperationStatus.FAILED,
            user_id=current_user_id,
            partner_id=partner_id,
            error_code=exc.code,
            started_at=started_at,
        )
        raise


@admin_router.get("/{partner_id}/templates", response_model=list[PartnerTemplateResponse])
async def list_partner_templates(
    partner_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[PartnerTemplate]:
    return await PartnerTemplateService(session).list_partner_templates(partner_id)


@admin_router.post(
    "/{partner_id}/templates",
    response_model=PartnerTemplateResponse,
    status_code=201,
)
async def upload_partner_template(
    partner_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    file: Annotated[UploadFile | None, File()] = None,
) -> PartnerTemplate:
    current_user_id = current_user.id
    started_at = OperationLogService.start_timer()
    try:
        template = await PartnerTemplateService(session).upload_template(
            partner_id=partner_id,
            file=file,
            uploaded_by=current_user_id,
        )
        await OperationLogService(session).log(
            operation_type=OperationType.UPLOAD_TEMPLATE,
            status=OperationStatus.SUCCESS,
            user_id=current_user_id,
            partner_id=partner_id,
            started_at=started_at,
        )
        await OperationLogService(session).log(
            operation_type=OperationType.ACTIVATE_TEMPLATE,
            status=OperationStatus.SUCCESS,
            user_id=current_user_id,
            partner_id=partner_id,
            started_at=started_at,
        )
        return template
    except AppError as exc:
        await session.rollback()
        await OperationLogService(session).log(
            operation_type=OperationType.UPLOAD_TEMPLATE,
            status=OperationStatus.FAILED,
            user_id=current_user_id,
            partner_id=partner_id,
            error_code=exc.code,
            started_at=started_at,
        )
        raise
