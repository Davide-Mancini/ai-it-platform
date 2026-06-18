from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
import uuid

class Role(Base):
    __tablename__="roles"
    
    id=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name= Column(String, unique=True, nullable=False,index=True)
    description= Column(String, nullable=True)
    users= relationship("User", back_populates="role")