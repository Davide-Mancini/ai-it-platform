from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from api.endpoints.auth import get_current_user
import schemas
from db.database import get_db
from services import document_service
router = APIRouter()

@router.get('/documents', response_model=List[schemas.DocumentResponse])
def get_all(db:Session= Depends(get_db)):
    return document_service.get_all(db)

@router.post('/documents',response_model=schemas.DocumentResponse)
def new_document(
    document: schemas.DocumentCreate,
    db:Session=Depends(get_db),
    current_user = Depends(get_current_user)
        ):
    return document_service.create_document(db, document,current_user)

@router.patch('/documents/{id}', response_model=schemas.DocumentResponse)
def update_document(
    id: UUID,
    data: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    doc = document_service.update_document(db, id, data.model_dump(exclude_unset=True))
    if not doc:
        raise HTTPException(status_code=404, detail="Documento non trovato")
    return doc

@router.delete('/documents/{id}', status_code=204)
def delete_document(
    id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    doc = document_service.delete_document(db, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento non trovato")