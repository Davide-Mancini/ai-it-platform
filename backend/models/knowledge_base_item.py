from datetime import datetime
import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from db.database import Base

class KnowledgeBaseItem(Base):
    __tablename__ = "knowledge_base_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(255), nullable=False)  
    content = Column(Text, nullable=False) 
    category = Column(String(100), nullable=False, index=True) 
    tags = Column(ARRAY(String), nullable=True) 
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)