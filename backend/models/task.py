import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db.database import Base
from sqlalchemy.orm import relationship
from models.associations import task_user_assignments

class Task(Base):
    __tablename__ = "tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    status = Column(String, default="pending")
    priority = Column(String, default="low")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    procedure_id = Column(UUID(as_uuid=True), ForeignKey("procedures.id", ondelete="CASCADE"), nullable=False)

    procedure = relationship("Procedure", back_populates="tasks")
    assigned_users = relationship("User", secondary=task_user_assignments, back_populates="assigned_tasks")