from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base
import uuid

class ProcedureStep(Base):
    __tablename__ = "procedure_steps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    version_id = Column(String, ForeignKey("procedure_versions.id", ondelete="CASCADE"), nullable=False)
    
    step_number = Column(Integer, nullable=False) 
    title = Column(String(150), nullable=False) 
    description = Column(Text, nullable=False)  
    estimated_duration = Column(Integer, nullable=True)

    # Relazione
    version = relationship("ProcedureVersion", back_populates="steps")