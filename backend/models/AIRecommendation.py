from sqlalchemy import Column, Integer, Text, Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base
import uuid

class AIRecommendation(Base):
    
    __tablename__ = "ai_recommendations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    # Chi ha richiesto la procedura
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Il tipo di richiesta (es. "procedure_generation")
    context_type = Column(String, nullable=False, default="procedure_generation")
    # Il prompt originale dell'utente
    input_data = Column(Text, nullable=False)
    # Il JSON generato da Gemini salvato come stringa di testo
    output_text = Column(Text, nullable=False)
    # Stato dell'approvazione: None = In attesa, True = Accettato, False = Rifiutato
    is_accepted = Column(Boolean, nullable=True, default=None)
    created_at = Column(DateTime, default=datetime.now)
    user = relationship("User")