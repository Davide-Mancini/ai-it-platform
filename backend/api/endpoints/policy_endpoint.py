from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from typing import List

from db.database import get_db
from schemas.policy_schema import PolicyCreate, PolicyResponse
from services.policy_service import PolicyService
from api.endpoints.auth import get_current_user
import models

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
    policy = PolicyService.get_policy(db, id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy non trovata")
    return policy


@router.post("/", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    data: PolicyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Solo gli admin possono creare policy")

    existing_cat = db.query(models.Policy).filter(models.Policy.category == data.category).first()
    if existing_cat:
        raise HTTPException(status_code=400, detail=f"Esiste già una policy con categoria '{data.category}'")

    if data.document_id:
        doc = db.query(models.Document).filter(models.Document.id == data.document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Documento non trovato")

    policy = models.Policy(
        title=data.title,
        description=data.description,
        category=data.category,
        document_id=data.document_id,
    )
    db.add(policy)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Esiste già una policy con categoria '{data.category}'")

    db.refresh(policy)
    return policy
