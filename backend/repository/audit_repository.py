from sqlalchemy.orm import Session
import models

def get_all_audit_log(db: Session, page: int, page_size: int):
    query = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return total, items