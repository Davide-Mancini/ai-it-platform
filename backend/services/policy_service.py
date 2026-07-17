from sqlalchemy.orm import Session
from uuid import UUID
from repository.policy_repository import PolicyRepository

class PolicyService:

    @staticmethod
    def get_policy(db: Session, policy_id: UUID):
        return PolicyRepository.get_by_id(db, policy_id)

    @staticmethod
    def list_policies(db: Session, skip: int = 0, limit: int = 100, only_active: bool = False):
        if only_active:
            return PolicyRepository.get_active_policies(db)
        return PolicyRepository.get_multi(db, skip=skip, limit=limit)