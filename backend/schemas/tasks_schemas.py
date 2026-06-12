from pydantic import BaseModel
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    status: str = "pending"

class TaskCreate(TaskBase):
    pass

class TaskUpdateStatus(BaseModel):
    status: str

class TaskOut(TaskBase):
    id: str
    procedure_id: str

    class Config:
        from_attributes = True