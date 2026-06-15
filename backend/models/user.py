import uuid

from sqlalchemy import Column, Integer, String, Boolean,ForeignKey, Text, DateTime, Enum as SqlEnum
from db.database import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from enums import UserRole

#Entity per UsersS
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SqlEnum(UserRole), default=UserRole.CUSTOMER) 
    is_active = Column(Boolean, default=True)
    # Relazione con Procedure
    procedures = relationship("Procedure", back_populates="author")