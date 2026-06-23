from uuid import UUID
from pydantic import BaseModel

class TaskBase(BaseModel):
    title: str
    status: str = "pending"

class TaskCreate(TaskBase):
    pass

class TaskUpdateStatus(BaseModel):
    status: str

class TaskOut(TaskBase):
    id: UUID
    procedure_id: UUID

    class Config:
        from_attributes = True