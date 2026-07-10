from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


# ── Structured output atteso da Gemini ──────────────────────────────────────

class AIReviewChange(BaseModel):
    step_number: Optional[int] = None
    field: str = Field(..., description="title | description | new_step | remove_step")
    current_value: Optional[str] = None
    proposed_value: str


class AIReviewFinding(BaseModel):
    procedure_title: str = Field(..., description="Titolo esatto della procedura a cui si riferisce il finding")
    severity: str = Field(..., description="low | medium | high | critical")
    category: str = Field(..., description="Inefficiency | Outdated | Policy Violation | Duplication | Clarity | Missing Step")
    summary: str
    rationale: str
    proposed_changes: List[AIReviewChange] = []
    referenced_policy_titles: List[str] = []
    referenced_document_titles: List[str] = []


class AIReviewResponse(BaseModel):
    findings: List[AIReviewFinding] = []


# ── Schemi API ───────────────────────────────────────────────────────────────

class ProcedureReviewRunOut(BaseModel):
    id: UUID
    triggered_by: str
    triggered_by_user_id: Optional[UUID] = None
    status: str
    procedures_reviewed: int
    findings_count: int
    error_message: Optional[str] = None
    started_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewRunTriggerOut(BaseModel):
    run_id: UUID
    status: str


class ProcedureReviewFindingOut(BaseModel):
    id: UUID
    run_id: UUID
    procedure_id: UUID
    version_id: UUID
    severity: str
    category: str
    summary: str
    rationale: str
    proposed_changes: List[AIReviewChange]
    referenced_policy_titles: List[str]
    referenced_document_titles: List[str]
    status: str
    reviewed_by_id: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    procedure_title: Optional[str] = None

    class Config:
        from_attributes = True


class PaginatedFindingsOut(BaseModel):
    items: List[ProcedureReviewFindingOut]
    total: int
    page: int
    page_size: int
