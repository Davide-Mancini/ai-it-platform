import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.database import Base


class ProcedureReviewRun(Base):
    __tablename__ = "procedure_review_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # "scheduler" (job periodico) oppure "manual" (pulsante in ProcedAI)
    triggered_by = Column(String(20), nullable=False, default="manual")
    triggered_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # running | completed | failed
    status = Column(String(20), nullable=False, default="running")
    procedures_reviewed = Column(Integer, nullable=False, default=0)
    findings_count = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    finished_at = Column(DateTime, nullable=True)

    triggered_by_user = relationship("User")
    findings = relationship("ProcedureReviewFinding", back_populates="run", cascade="all, delete-orphan")
