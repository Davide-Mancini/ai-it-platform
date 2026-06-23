from typing import Optional
from sqlalchemy.orm import Session
from uuid import UUID
from repository.kwonledgeBI_repository import KBItemRepository
from schemas.kwoledgeBI_schema import KBItemCreate

class KBItemService:

    @staticmethod
    def create_item(db: Session, item_in: KBItemCreate):
        return KBItemRepository.create(db, item_in)

    @staticmethod
    def get_item(db: Session, item_id: UUID):
        return KBItemRepository.get_by_id(db, item_id)

    @staticmethod
    def list_items(db: Session, category: Optional[str] = None, skip: int = 0, limit: int = 100):
        if category:
            return KBItemRepository.get_by_category(db, category)
        return KBItemRepository.get_multi(db, skip=skip, limit=limit)