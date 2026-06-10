import uuid

from sqlalchemy import Column, Integer, String, Boolean,ForeignKey, Text, DateTime
from database import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Engineer") # Es. System Administrator, IT Manager, Engineer
    is_active = Column(Boolean, default=True)
    # Relazione con Procedure
    procedures = relationship("Procedure", back_populates="author")

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

class Task(Base):
    __tablename__= "tasks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title= Column(String, nullable=False)
    status= Column(String, default="pending")

    # Chiave esterna che collega il task alla procedura a cui appartiene
    procedure_id = Column(String, ForeignKey("procedures.id", ondelete="CASCADE"), nullable=False)

    # Relazione con Procedure
    procedure = relationship("Procedure", back_populates="tasks")