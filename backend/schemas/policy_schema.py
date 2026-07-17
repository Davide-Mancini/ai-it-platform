from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class PolicyCreate(BaseModel):
    title: str
    description: str
    category: str
    document_id: Optional[UUID] = None

    model_config = {"from_attributes": True}

class PolicyResponse(BaseModel):
    id: UUID
    title: str
    description: str
    category: str
    is_active: bool
    document_id: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}