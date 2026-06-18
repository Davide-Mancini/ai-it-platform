from uuid import UUID
from pydantic import BaseModel,Field
from typing import Optional, List
from datetime import datetime
from schemas.procedure_steps_schemas import ProcedureStepBase,ProcedureStepCreate,ProcedureStepOut


class ProcedureVersionBase(BaseModel):
    version_number:str=Field("1.0.0", max_length=10,description="Codice versione")
    status: str = Field("draft", description=" Stato versione")
    change_description: Optional[str]= Field(None, description="Note su cosa e cambiato")
    
class ProcedureVersionCreate(ProcedureVersionBase):
        steps: List[ProcedureStepCreate]
        
class ProcedureVersionPut(ProcedureVersionBase):
    id: UUID
    procedure_id: UUID
    created_at: datetime
    created_by_id: Optional[UUID]
    steps: List[ProcedureStepOut]
    
class Config:
    from_attributes = True
    