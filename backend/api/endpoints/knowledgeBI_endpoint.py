from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from db.database import get_db
from schemas.kwoledgeBI_schema import KBItemCreate, KBItemResponse
from services.knowledgeBI_service import KBItemService

router = APIRouter()

@router.post("/", response_model=KBItemResponse)
def create_kb_item(item: KBItemCreate, db: Session = Depends(get_db)):
    return KBItemService.create_item(db, item)

@router.get("/", response_model=List[KBItemResponse])
def get_all_kb_items(
    category: Optional[str] = None, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    return KBItemService.list_items(db, category=category, skip=skip, limit=limit)