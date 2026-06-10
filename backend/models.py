from sqlalchemy import Column, Integer, String, Boolean,ForeignKey, Text, DateTime
from database import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Engineer") # Es. System Administrator, IT Manager, Engineer
    is_active = Column(Boolean, default=True)
    # Relazione con Procedure
    procedures = relationship("Procedure", back_populates="author")

class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("users.id"))
    # Relazione con User
    author = relationship("User", back_populates="procedures")    