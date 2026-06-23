import uuid
from sqlalchemy import Column, String,ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone


#Questa e la classe (entities) delle procedure
class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    # Relazione con User
    author = relationship("User", back_populates="procedures")    
    # Relazione con i Task (se elimini la procedura, si eliminano anche i suoi task)
    tasks = relationship("Task", back_populates="procedure", cascade="all, delete-orphan")
    #relazione con customer
    customer_id= Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer= relationship("Customer", back_populates="procedures")
    versions = relationship("ProcedureVersion", back_populates="procedure", cascade="all, delete-orphan")
    