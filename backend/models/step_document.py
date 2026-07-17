from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base

step_document = Table(
    "step_documents",
    Base.metadata,
    Column("step_id", UUID(as_uuid=True), ForeignKey("procedure_steps.id", ondelete="CASCADE"), primary_key=True),
    Column("document_id", UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
)
