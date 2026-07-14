from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from db.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

class Document(Base):
    __tablename__= 'documents'
    
    id= Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    file_path = Column(String(512), nullable=True)
    file_type = Column(String(50), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # Se valorizzato, il documento e' stato caricato da un cliente (documentazione aziendale propria)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=True)
    # Se valorizzato, il documento e' un allegato a un task specifico; se nullo (con customer_id
    # presente), e' un documento generale del profilo azienda
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    created_at= Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),nullable=False)
    updated_at=Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))