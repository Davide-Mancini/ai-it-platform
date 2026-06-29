from uuid import UUID
from typing import List
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

class TaskCreate(TaskBase):
    pass

class TaskUpdateStatus(BaseModel):
    status: str

class TaskAssign(BaseModel):
    user_id: UUID

class TaskOut(TaskBase):
    id: UUID
    procedure_id: UUID
    assigned_users: List[UserMinimal] = []

    class Config:
        from_attributes = True
