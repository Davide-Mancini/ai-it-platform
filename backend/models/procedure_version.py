from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base
import uuid

class ProcedureVersion(Base):
    __tablename__ = "procedure_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    procedure_id = Column(UUID(as_uuid=True), ForeignKey("procedures.id", ondelete="CASCADE"), nullable=False)
    
    version_number = Column(String(20), default="1.0.0", nullable=False)
    status = Column(String(30), default="draft", nullable=False) 
    change_description = Column(Text, nullable=True)                    
    
    created_at = Column(DateTime, default=datetime.utcnow)
    # Chi ha creato/approvato questa specifica versione?
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relazioni
    procedure = relationship("Procedure", back_populates="versions")
    steps = relationship("ProcedureStep", back_populates="version", cascade="all, delete-orphan")