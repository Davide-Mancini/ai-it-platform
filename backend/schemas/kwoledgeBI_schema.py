from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class KBItemCreate(BaseModel):
    title: str
    content: str
    category: str
    tags: Optional[List[str]] = []

class KBItemResponse(BaseModel):
    id: UUID
    title: str
    content: str
    category: str
    tags: List[str]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }