from uuid import UUID
from fastapi import Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
import models
import schemas
from repository import documents_repository, task_repository
from api.endpoints.auth import get_current_user
from services.task_service import _is_customer

def create_document(
    db: Session,
    document: schemas.DocumentCreate,
    current_user: models.User = Depends(get_current_user)
    ):
    new_doc= models.Document(
        title= document.title,
        content= document.content,
        file_path= document.file_path,
        file_type= document.file_type,
        user_id= current_user.id
    )
    return documents_repository.new_document(db,new_doc)


def create_customer_upload(
    db: Session,
    title: str,
    file_path: str,
    file_type: str,
    task_id: UUID | None,
    current_user: models.User,
):
    if not _is_customer(current_user):
        raise HTTPException(status_code=403, detail="Solo un utente con ruolo Customer può caricare questo documento")
    if task_id:
        task = task_repository.get_task_by_id(db, str(task_id))
        if not task or task.procedure.customer_id != current_user.customer_id:
            raise HTTPException(status_code=403, detail="Non autorizzato a collegare il documento a questo task")
    new_doc = models.Document(
        title=title,
        content=None,
        file_path=file_path,
        file_type=file_type,
        user_id=current_user.id,
        customer_id=current_user.customer_id,
        task_id=task_id,
    )
    return documents_repository.new_document(db, new_doc)

def get_document_by_id(
    db:Session,
    id: UUID
):
    return documents_repository.get_by_id(db, id)

def get_all(
    db: Session,
    current_user: models.User,
):
    if _is_customer(current_user):
        return documents_repository.get_all_for_customer(db, current_user.customer_id)
    return documents_repository.get_all(db)

def update_document(db: Session, id: UUID, data: dict):
    return documents_repository.update_document(db, id, data)

def delete_document(db: Session, id: UUID):
    return documents_repository.delete_document(db, id)