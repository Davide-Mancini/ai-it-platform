from typing import Optional
from pydantic import BaseModel


class CollaboratorOut(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    role: Optional[str] = None
    is_active: bool
    shared_tasks_count: int
