import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from db.database import Base


class ProcedureReviewFinding(Base):
    __tablename__ = "procedure_review_findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("procedure_review_runs.id", ondelete="CASCADE"), nullable=False)
    procedure_id = Column(UUID(as_uuid=True), ForeignKey("procedures.id", ondelete="CASCADE"), nullable=False)
    version_id = Column(UUID(as_uuid=True), ForeignKey("procedure_versions.id", ondelete="CASCADE"), nullable=False)

    # low | medium | high | critical
    severity = Column(String(20), nullable=False, default="medium")
    # inefficiency | outdated | policy_violation | duplication | clarity | missing_step
    category = Column(String(30), nullable=False, default="inefficiency")
    summary = Column(String(255), nullable=False)
    rationale = Column(Text, nullable=False)
    # Lista di {step_number, field, current_value, proposed_value}
    proposed_changes = Column(JSONB, nullable=False, default=list)
    referenced_policy_titles = Column(JSONB, nullable=False, default=list)
    referenced_document_titles = Column(JSONB, nullable=False, default=list)

    # pending | accepted | dismissed
    status = Column(String(20), nullable=False, default="pending")
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    run = relationship("ProcedureReviewRun", back_populates="findings")
    procedure = relationship("Procedure")
    version = relationship("ProcedureVersion")
    reviewed_by = relationship("User")
