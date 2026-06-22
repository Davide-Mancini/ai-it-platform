from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class PolicyResponse(BaseModel):
    id: UUID
    title: str
    description: str
    code: str
    is_active: bool
    document_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True 
    }