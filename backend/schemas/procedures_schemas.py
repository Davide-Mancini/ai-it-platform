from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

class ProcedureBase(BaseModel):
    title: str
    description: str|None = None

class ProcedureCreate(ProcedureBase):
    language: str = "it"

class ProcedureOut(ProcedureBase):
    id: UUID
    created_at: datetime
    user_id: UUID
    language: str = "it"

    class Config:
        from_attributes = True
