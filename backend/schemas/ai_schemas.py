from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class AIRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000, description="Richiesta dell'utente per la generazione della procedura")
    language: str = "it"
    customer_id: Optional[UUID] = None


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
    language: str = "it"
    customer_id: Optional[UUID] = None
    created_at: datetime


# Conteggi per il grafico "tasso di accettazione AI" della dashboard
class RecommendationStatsOut(BaseModel):
    accepted: int
    rejected: int
    pending: int
