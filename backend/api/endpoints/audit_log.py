from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from typing import List
import schemas
from db.database import get_db
from services import audit_logger

router = APIRouter()

@router.get("/get_all", response_model=List[schemas.AuditLogOut])
def get_all_audit_log(db: Session = Depends(get_db)):
    return audit_logger.get_all_audit_log(db)