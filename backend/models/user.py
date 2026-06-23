import uuid

from sqlalchemy import Column, String, Boolean,ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base
from sqlalchemy.orm import relationship


#Entity per UsersS
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = relationship("Role", back_populates="users")
    role_id=Column(UUID(as_uuid=True), ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    # Relazione con Procedure
    procedures = relationship("Procedure", back_populates="author")