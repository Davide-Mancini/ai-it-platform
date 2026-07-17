from sqlalchemy.orm import Session
from uuid import UUID
from models.knowledge_base_item import KnowledgeBaseItem
from schemas.kwoledgeBI_schema import KBItemCreate

class KBItemRepository:

    @staticmethod
    def create(db: Session, item_in: KBItemCreate) -> KnowledgeBaseItem:
        db_obj = KnowledgeBaseItem(**item_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, item_id: UUID) -> KnowledgeBaseItem:
        return db.query(KnowledgeBaseItem).filter(KnowledgeBaseItem.id == item_id).first()

    @staticmethod
    def get_by_category(db: Session, category: str):
        return db.query(KnowledgeBaseItem).filter(KnowledgeBaseItem.category == category).all()

    @staticmethod
    def get_multi(db: Session, skip: int = 0, limit: int = 100):
        return db.query(KnowledgeBaseItem).offset(skip).limit(limit).all()