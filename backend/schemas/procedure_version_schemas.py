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
    id: str
    procedure_id: str
    created_at: datetime
    created_by_id: Optional[str]
    steps: List[ProcedureStepOut]
    
class Config:
    from_attributes = True
    