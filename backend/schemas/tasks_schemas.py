from uuid import UUID
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class UserMinimal(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str

    model_config = {"from_attributes": True}


class TaskBase(BaseModel):
    title: str
    status: str = "pending"
    priority: str = "low"

class TaskCreate(TaskBase):
    pass

class TaskUpdateStatus(BaseModel):
    status: str

class TaskUpdatePriority(BaseModel):
    priority: str

class TaskAssign(BaseModel):
    user_id: UUID

class TaskOut(TaskBase):
    id: UUID
    procedure_id: UUID
    assigned_users: List[UserMinimal] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
