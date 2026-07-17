import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db.database import Base
from sqlalchemy.orm import relationship
from models.associations import task_user_assignments

class Task(Base):
    __tablename__ = "tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    status = Column(String, default="pending")
    priority = Column(String, default="low")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    # Se True, il task richiede un'azione/dato dal cliente collegato alla procedura:
    # solo questi task sono visibili a un utente con ruolo Customer
    requires_customer_input = Column(Boolean, nullable=False, default=False, server_default="false")
    # Elenco di campi richiesti al cliente: [{"key": "...", "label": "..."}, ...].
    # Se vuoto/nullo, il task e' trattato come un singolo campo implicito.
    required_fields = Column(JSON, nullable=True)
    # Dati inviati dal cliente in risposta alla richiesta: {key: valore, ...}
    customer_response_data = Column(JSON, nullable=True)

    procedure_id = Column(UUID(as_uuid=True), ForeignKey("procedures.id", ondelete="CASCADE"), nullable=False)

    procedure = relationship("Procedure", back_populates="tasks")
    assigned_users = relationship("User", secondary=task_user_assignments, back_populates="assigned_tasks")