import uuid 
from sqlalchemy import Column, String, Text, Boolean,ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime, timezone


class Policy (Base):
    __tablename__= 'policies'
    
    id= Column(UUID(as_uuid=True),primary_key=True, default=uuid.uuid4,index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    #Collegamento a documenti
    document_id = Column(UUID(as_uuid=True), ForeignKey('documents.id', ondelete='SET NULL'), nullable= True)
    created_at= Column(DateTime, default= lambda: datetime.now(timezone.utc), nullable=False)
    updated_at=Column(DateTime, default=datetime.now, onupdate=datetime.now)
    relationship('Documents', backref='policies')