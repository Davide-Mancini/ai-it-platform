from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from db.database import get_db
from schemas.policy_schema import PolicyResponse
from services.policy_service import PolicyService

router = APIRouter()

@router.get("/", response_model=List[PolicyResponse])
def get_all_policies(
    only_active: bool = False, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    return PolicyService.list_policies(db, skip=skip, limit=limit, only_active=only_active)

@router.get("/{id}", response_model=PolicyResponse)
def get_policy_by_id(id: UUID, db: Session = Depends(get_db)):
    """Recupera una singola policy tramite il suo UUID"""
    policy = PolicyService.get_policy(db, id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy interna non trovata")
    return policy