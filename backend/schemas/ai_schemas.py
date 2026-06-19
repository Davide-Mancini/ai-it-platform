from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class AIRequest(BaseModel):
    prompt: str


class AIStepStructure(BaseModel):
    step_number: int
    title: str
    description: str
    relevant_document_titles: List[str] = []

    class Config:
        from_attributes = True


class AIProcedureResponse(BaseModel):
    title: str
    description: str
    tasks: List[AIStepStructure]


class AIRecommendationOut(BaseModel):
    id: UUID
    user_id: UUID
    context_type: str
    input_data: str
    output_text: str
    is_accepted: Optional[bool]
    created_at: datetime
