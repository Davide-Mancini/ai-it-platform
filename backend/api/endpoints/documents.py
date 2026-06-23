from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
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