from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

class ProcedureBase(BaseModel):
    title: str
    description: str|None = None

class ProcedureCreate(ProcedureBase):
    pass

class ProcedureOut(ProcedureBase):
    id: UUID
    created_at: datetime
    user_id: UUID

    class Config:
        from_attributes = True
