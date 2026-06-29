from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

# Schema base con i campi comuni
class AuditLogBase(BaseModel):
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None 

# Schema usato per la creazione interna del Log
class AuditLogCreate(AuditLogBase):
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

# Schema di output per Swagger / Frontend
class AuditLogOut(AuditLogBase):
    id: UUID
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Schema leggero per la dashboard — include nome utente, niente dati sensibili
class ActivityOut(BaseModel):
    id: str
    action: str
    target_type: Optional[str] = None
    created_at: str
    user_first_name: Optional[str] = None
    user_last_name: Optional[str] = None
    user_email: Optional[str] = None