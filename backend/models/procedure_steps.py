from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
from models.step_document import step_document
import uuid

class ProcedureStep(Base):
    __tablename__ = "procedure_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id = Column(UUID(as_uuid=True), ForeignKey("procedure_versions.id", ondelete="CASCADE"), nullable=False)

    step_number = Column(Integer, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    estimated_duration = Column(Integer, nullable=True)

    version = relationship("ProcedureVersion", back_populates="steps")
    documents = relationship("Document", secondary=step_document, lazy="selectin")