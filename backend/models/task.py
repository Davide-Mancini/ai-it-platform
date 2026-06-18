import uuid

from sqlalchemy import Column, Integer, String, Boolean,ForeignKey, Text, DateTime, Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from enums import UserRole

#Entity per i tasks
class Task(Base):
    __tablename__= "tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title= Column(String, nullable=False)
    status= Column(String, default="pending")

    # Chiave esterna che collega il task alla procedura a cui appartiene
    procedure_id = Column(UUID(as_uuid=True), ForeignKey("procedures.id", ondelete="CASCADE"), nullable=False)

    # Relazione con Procedure
    procedure = relationship("Procedure", back_populates="tasks")