from sqlalchemy import Column, String, DateTime, JSON, ForeignKey,event
from datetime import datetime, timezone
import uuid
from db.database import Base
from sqlalchemy.dialects.postgresql import UUID
class AuditLog(Base):
    __tablename__="audit_logs"
    
    id= Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id= Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete='SET NULL'), nullable=True)
    user_email = Column(String, nullable=True)
    action= Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    target_type = Column(String, nullable= True)
    target_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    created_at= Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
  

# Ascolta se qualcuno prova a fare un UPDATE o DELETE su questo modello
@event.listens_for(AuditLog, 'before_update')
@event.listens_for(AuditLog, 'before_delete')
def receive_before_write(mapper, connection, target):
    raise PermissionError("Gli Audit Log sono immutabili a livello applicativo.")