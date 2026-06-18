from sqlalchemy import Column,Integer,String,Boolean,DateTime,Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base
import uuid

class Customer(Base):
    __tablename__= "customers"
    
    id=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name= Column(String(50), nullable=False,unique=True)
    vat_number= Column(String(50), nullable=False)
    email= Column(String(50), nullable=True)
    is_active= Column(Boolean,default=True)
    notes=Column(Text, nullable=True)
    created_at=Column(DateTime, default=datetime.now)
    updated_at=Column(DateTime, default=datetime.now, onupdate=datetime.now)
    procedures = relationship("Procedure", back_populates="customer",cascade="all, delete-orphan")
    