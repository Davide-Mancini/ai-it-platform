import uuid

from sqlalchemy import Column, Integer, String, Boolean,ForeignKey, Text, DateTime, Enum as SqlEnum
from db.database import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from enums import UserRole

class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    user_id = Column(String, ForeignKey("users.id"))
    # Relazione con User
    author = relationship("User", back_populates="procedures")    
    # Relazione con i Task (se elimini la procedura, si eliminano anche i suoi task)
    tasks = relationship("Task", back_populates="procedure", cascade="all, delete-orphan")
