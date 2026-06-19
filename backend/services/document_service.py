from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status,Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from services.audit_logger import log_action
from security.security import get_password_hash, create_access_token, verify_password, verify_access_token
import models
import schemas
from db.database import get_db
from repository import documents_repository
from models import Role
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