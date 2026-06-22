from sqlalchemy.orm import Session
from uuid import UUID
from models.policy import Policy

class PolicyRepository:

    @staticmethod
    def get_by_id(db: Session, policy_id: UUID) -> Policy:
        return db.query(Policy).filter(Policy.id == policy_id).first()

    @staticmethod
    def get_multi(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Policy).offset(skip).limit(limit).all()

    @staticmethod
    def get_active_policies(db: Session):
        return db.query(Policy).filter(Policy.is_active == True).all()