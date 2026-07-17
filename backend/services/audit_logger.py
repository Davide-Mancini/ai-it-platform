from sqlalchemy.orm import Session
import models
from typing import Any,Dict,Optional
from repository import audit_repository

def log_action(
    db: Session,
    current_user: models.User,
    action: str,
    ip_address: Optional[str] = None,  
    user_agent: Optional[str] = None,  
    target_type: Optional[str] = None,
    target_id: Optional[Any] = None,
    details: Optional[Dict[str, Any]] = None
):

    audit_log= models.AuditLog(
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else "SYSTEM",
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else None,
        ip_address=ip_address, 
        user_agent=user_agent, 
        details=details
    )
    db.add(audit_log)
    
def get_all_audit_log(db: Session, page: int, page_size: int):
    return audit_repository.get_all_audit_log(db, page, page_size)
    
       