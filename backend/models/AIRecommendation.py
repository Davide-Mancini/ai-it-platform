from sqlalchemy import Column, Text, Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base
import uuid

class AIRecommendation(Base):
    
    __tablename__ = "ai_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Chi ha richiesto la procedura
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Il tipo di richiesta (es. "procedure_generation")
    context_type = Column(String, nullable=False, default="procedure_generation")
    # Il prompt originale dell'utente
    input_data = Column(Text, nullable=False)
    # Il JSON generato da Gemini salvato come stringa di testo
    output_text = Column(Text, nullable=False)
    # Stato dell'approvazione: None = In attesa, True = Accettato, False = Rifiutato
    is_accepted = Column(Boolean, nullable=True, default=None)
    # Lingua in cui e' stata generata la procedura (lingua UI di chi ha creato la richiesta)
    language = Column(String(5), nullable=False, default="it", server_default="it")
    # Cliente selezionato al momento della richiesta, riportato sulla Procedure se la raccomandazione viene accettata
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    user = relationship("User")