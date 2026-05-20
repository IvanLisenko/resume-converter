from pydantic import BaseModel, Field


class ResumeCandidate(BaseModel):
    full_name: str | None = None
    position: str | None = None
    total_experience: str | None = None
    level: str | None = None
    location: str | None = None
    available_from: str | None = None


class ResumeContacts(BaseModel):
    email: str | None = None
    phone: str | None = None
    telegram: str | None = None


class ResumeSkills(BaseModel):
    primary: list[str] = Field(default_factory=list)
    detailed: list[str] = Field(default_factory=list)


class ResumeEducationItem(BaseModel):
    raw: str


class ResumeLanguageItem(BaseModel):
    name: str
    level: str | None = None


class ResumeExperienceItem(BaseModel):
    title: str
    project_name: str | None = None
    period: str | None = None
    description: str | None = None
    responsibilities: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    team: str | None = None
    stack_text: str | None = None
    stack: list[str] = Field(default_factory=list)


class ResumeData(BaseModel):
    candidate: ResumeCandidate = Field(default_factory=ResumeCandidate)
    contacts: ResumeContacts = Field(default_factory=ResumeContacts)
    skills: ResumeSkills = Field(default_factory=ResumeSkills)
    summary: str | None = None
    education: list[ResumeEducationItem] = Field(default_factory=list)
    languages: list[ResumeLanguageItem] = Field(default_factory=list)
    experience: list[ResumeExperienceItem] = Field(default_factory=list)
    extra: dict[str, object] = Field(default_factory=dict)


class ResumeSource(BaseModel):
    filename: str
    size_bytes: int = Field(serialization_alias="sizeBytes")


class ResumeExtractResponse(BaseModel):
    resume: ResumeData
    warnings: list[str] = Field(default_factory=list)
    source: ResumeSource
