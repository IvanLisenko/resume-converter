from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.resume import ResumeExtractResponse, ResumeSource
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("/extract", response_model=ResumeExtractResponse)
async def extract_resume(
    current_user: Annotated[User, Depends(get_current_user)],
    file: Annotated[UploadFile | None, File()] = None,
) -> ResumeExtractResponse:
    result, size_bytes = await ResumeService().extract_trive_resume(file)
    return ResumeExtractResponse(
        resume=result.resume,
        warnings=result.warnings,
        source=ResumeSource(filename=file.filename or "resume.docx", size_bytes=size_bytes),
    )
