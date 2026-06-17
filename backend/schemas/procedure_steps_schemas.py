from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProcedureStepBase(BaseModel):
    step_number: int = Field(..., description="Numero sequenziale dello step (es. 1, 2, 3)")
    title: str = Field(..., max_length=150, description="Titolo del passaggio")
    description: str = Field(..., description="Contenuto tecnico dettagliato o comandi")
    estimated_duration: Optional[int] = Field(None, description="Durata stimata in minuti")

class ProcedureStepCreate(ProcedureStepBase):
    pass

class ProcedureStepOut(ProcedureStepBase):
    id: str
    version_id: str

    class Config:
        from_attributes = True