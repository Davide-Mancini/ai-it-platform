from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: UUID
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
