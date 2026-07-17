import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from api.endpoints.auth import get_current_approved_user
import models
import schemas
from db.database import get_db
from services import document_service
router = APIRouter()

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CUSTOMER_UPLOAD_DIR = os.path.join(_BACKEND_DIR, "uploads", "customer_documents")

@router.get('/documents', response_model=List[schemas.DocumentResponse])
def get_all(db:Session= Depends(get_db), current_user: models.User = Depends(get_current_approved_user)):
    return document_service.get_all(db, current_user)

@router.post('/documents/upload', response_model=schemas.DocumentResponse)
def upload_customer_document(
    title: str = Form(...),
    task_id: Optional[UUID] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user),
):
    if current_user.role.name != "Customer":
        raise HTTPException(status_code=403, detail="Solo un utente con ruolo Customer può caricare questo documento")
    customer_dir = os.path.join(CUSTOMER_UPLOAD_DIR, str(current_user.customer_id))
    os.makedirs(customer_dir, exist_ok=True)
    stored_filename = f"{uuid.uuid4()}_{file.filename}"
    disk_path = os.path.join(customer_dir, stored_filename)
    with open(disk_path, "wb") as out_file:
        out_file.write(file.file.read())
    served_path = f"/uploads/customer_documents/{current_user.customer_id}/{stored_filename}"
    # file_type e' un'estensione semplice ("pdf", "docx"...), coerente con la convenzione
    # gia' usata dai documenti interni (vedi seed.py) e con il badge colorato in Documents.jsx
    extension = os.path.splitext(file.filename or "")[1].lstrip(".").lower() or "file"
    return document_service.create_customer_upload(
        db, title, served_path, extension, task_id, current_user
    )

@router.post('/documents',response_model=schemas.DocumentResponse)
def new_document(
    document: schemas.DocumentCreate,
    db:Session=Depends(get_db),
    current_user = Depends(get_current_approved_user)
        ):
    return document_service.create_document(db, document,current_user)

@router.patch('/documents/{id}', response_model=schemas.DocumentResponse)
def update_document(
    id: UUID,
    data: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_approved_user),
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
    current_user = Depends(get_current_approved_user),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    doc = document_service.delete_document(db, id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento non trovato")