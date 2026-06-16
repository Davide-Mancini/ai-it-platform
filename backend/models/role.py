from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base
import uuid

class Role(Base):
    __tablename__="roles"
    
    id=Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name= Column(String, unique=True, nullable=False,index=True)
    description= Column(String, nullable=True)
    users= relationship("User", back_populates="role")