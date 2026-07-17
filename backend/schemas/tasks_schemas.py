from uuid import UUID
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel


class UserMinimal(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str

    model_config = {"from_attributes": True}


class RequiredField(BaseModel):
    key: str
    label: str


class TaskBase(BaseModel):
    title: str
    status: str = "pending"
    priority: str = "low"

class TaskCreate(TaskBase):
    requires_customer_input: bool = False
    required_fields: Optional[List[RequiredField]] = None

class TaskUpdateStatus(BaseModel):
    status: str

class TaskUpdatePriority(BaseModel):
    priority: str

class TaskAssign(BaseModel):
    user_id: UUID

class TaskCustomerResponse(BaseModel):
    response_data: Dict[str, str]

class TaskOut(TaskBase):
    id: UUID
    procedure_id: UUID
    assigned_users: List[UserMinimal] = []
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    requires_customer_input: bool = False
    required_fields: Optional[List[RequiredField]] = None
    customer_response_data: Optional[Dict[str, str]] = None

    class Config:
        from_attributes = True


# Schema per il grafico "tempo medio di risoluzione" nella sezione Analytics
class PriorityResolutionOut(BaseModel):
    priority: str
    avg_hours: Optional[float] = None
    count: int

class ResolutionTimeStatsOut(BaseModel):
    by_priority: List[PriorityResolutionOut]
    overall_avg_hours: Optional[float] = None
    resolved_count: int
