from sqlalchemy.orm import Session
import models

def get_all_audit_log(db:Session,):
    return db.query(models.AuditLog).all()