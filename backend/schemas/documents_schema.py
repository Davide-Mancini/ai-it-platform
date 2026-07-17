from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

#Campi condivisi tra creazione e lettura
class DocumentBase(BaseModel):
    title: str
    content: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None

#Schema per l'input quando si crea un documento
class DocumentCreate(DocumentBase):
    user_id: UUID

#Schema per l'aggiornamento parziale
class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None

#Schema di risposta (Output)
class DocumentResponse(DocumentBase):
    id: UUID
    user_id: Optional[UUID]
    customer_id: Optional[UUID] = None
    task_id: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {
        "from_attributes": True  # Permette di leggere i dati direttamente dall'oggetto SQLAlchemy
    }