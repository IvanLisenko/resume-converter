from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.resume import ResumeData


class ResumeGenerateRequest(BaseModel):
    partner_id: UUID = Field(validation_alias="partnerId", serialization_alias="partnerId")
    resume: ResumeData
