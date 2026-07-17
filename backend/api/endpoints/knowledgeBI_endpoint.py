from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

import models
from db.database import get_db
from schemas.kwoledgeBI_schema import KBItemCreate, KBItemResponse
from services.knowledgeBI_service import KBItemService
from api.endpoints.auth import get_current_approved_user

router = APIRouter()

@router.post("/", response_model=KBItemResponse)
def create_kb_item(
    item: KBItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user),
):
    return KBItemService.create_item(db, item)

@router.get("/", response_model=List[KBItemResponse])
def get_all_kb_items(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user),
):
    return KBItemService.list_items(db, category=category, skip=skip, limit=limit)