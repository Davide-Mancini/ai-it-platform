from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from db.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

class Document(Base):
    __tablename__= 'documents'
    
    id= Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)  
    file_path = Column(String(512), nullable=True)  
    file_type = Column(String(50), nullable=True)  
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at= Column(DateTime, default=datetime.now,nullable=False)
    updated_at=Column(DateTime, default=datetime.now, onupdate=datetime.now)