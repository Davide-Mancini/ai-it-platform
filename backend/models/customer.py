from sqlalchemy import Column,Integer,String,Boolean,DateTime,Text
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base
import uuid

class Customer(Base):
    __tablename__= "customers"
    
    id=Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name= Column(String(50), nullable=False,unique=True)
    vat_number= Column(String(50), nullable=False)
    email= Column(String(50), nullable=True)
    is_active= Column(Boolean,default=True)
    notes=Column(Text, nullable=True)
    created_at=Column(DateTime, default=datetime.now)
    updated_at=Column(DateTime, default=datetime.now, onupdate=datetime.now)
    procedures = relationship("Procedure", back_populates="customer",cascade="all, delete-orphan")
    