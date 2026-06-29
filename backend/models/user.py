import uuid

from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base
from sqlalchemy.orm import relationship
from models.associations import task_user_assignments


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = relationship("Role", back_populates="users")
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    procedures = relationship("Procedure", back_populates="author")
    assigned_tasks = relationship("Task", secondary=task_user_assignments, back_populates="assigned_users")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")