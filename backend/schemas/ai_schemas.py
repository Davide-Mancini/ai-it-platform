from pydantic import BaseModel
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
class AIRequest(BaseModel):
    prompt: str

# Schema per il singolo task generato dall'IA
class AITaskStructure(BaseModel):
    title: str

# Schema completo che l'IA DOVRÀ rispettare
class AIProcedureResponse(BaseModel):
    title: str
    description: str
    tasks: list[AITaskStructure]
class AIRecommendationOut(BaseModel):
    id: str
    user_id: str
    context_type: str
    input_data: str
    output_text: str
    is_accepted: Optional[bool]
    created_at: datetime

    class Config:
        from_attributes = True