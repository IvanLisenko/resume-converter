from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.background import BackgroundTask
from starlette.responses import FileResponse

from app.api.dependencies import get_current_user
from app.core.errors import AppError
from app.db.session import get_db_session
from app.models.enums import OperationStatus, OperationType
from app.models.user import User
from app.schemas.generation import ResumeGenerateRequest
from app.schemas.resume import ResumeExtractResponse, ResumeSource
from app.services.operation_log_service import OperationLogService
from app.services.resume_generation_service import ResumeGenerationService
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("/extract", response_model=ResumeExtractResponse)
async def extract_resume(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    file: Annotated[UploadFile | None, File()] = None,
) -> ResumeExtractResponse:
    current_user_id = current_user.id
    started_at = OperationLogService.start_timer()
    try:
        result, size_bytes = await ResumeService().extract_trive_resume(file)
        await OperationLogService(session).log(
            operation_type=OperationType.EXTRACT_RESUME,
            status=OperationStatus.SUCCESS,
            user_id=current_user_id,
            started_at=started_at,
        )
        return ResumeExtractResponse(
            resume=result.resume,
            warnings=result.warnings,
            source=ResumeSource(filename=file.filename or "resume.docx", size_bytes=size_bytes),
        )
    except AppError as exc:
        await session.rollback()
        await OperationLogService(session).log(
            operation_type=OperationType.EXTRACT_RESUME,
            status=OperationStatus.FAILED,
            user_id=current_user_id,
            error_code=exc.code,
            started_at=started_at,
        )
        raise


@router.post("/generate", response_class=FileResponse)
async def generate_resume(
    payload: ResumeGenerateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> FileResponse:
    generated_resume = await ResumeGenerationService(session).generate_resume(
        payload=payload,
        user_id=current_user.id,
    )
    return FileResponse(
        path=generated_resume.path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=generated_resume.filename,
        background=BackgroundTask(generated_resume.path.unlink, missing_ok=True),
    )
