from uuid import UUID
from fastapi import Depends
from sqlalchemy.orm import Session
import models
import schemas
from repository import documents_repository
from api.endpoints.auth import get_current_user

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

def get_document_by_id(
    db:Session,
    id: UUID
):
    return documents_repository.get_by_id(db, id)

def get_all(
    db:Session
):
    return documents_repository.get_all(db)

def update_document(db: Session, id: UUID, data: dict):
    return documents_repository.update_document(db, id, data)

def delete_document(db: Session, id: UUID):
    return documents_repository.delete_document(db, id)