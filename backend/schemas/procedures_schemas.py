from pydantic import BaseModel
from datetime import datetime

class ProcedureBase(BaseModel):
    title: str
    description: str|None = None

class ProcedureCreate(ProcedureBase):
    pass

class ProcedureOut(ProcedureBase):
    id: str
    created_at: datetime
    user_id: str

    class Config:
        from_attributes = True
