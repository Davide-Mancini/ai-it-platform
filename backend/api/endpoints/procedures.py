from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user
from services import procedure_service

router = APIRouter()

#Creazione nuova procedura, richiede autenticazione
@router.post("/", response_model=schemas.ProcedureOut)
def create_procedure(
    procedure: schemas.ProcedureCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return procedure_service.create_procedure(procedure,ip_address,user_agent, db, current_user)

#Recupero tutte le procedure
@router.get("/", response_model=List[schemas.ProcedureOut])
def get_all_procedures(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Procedure).all()

#Recupero una determinata procedura tramite id
@router.get("/{id}", response_model=schemas.ProcedureOut)
def get_procedure_by_id(
    id: str,
    db: Session= Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return procedure_service.get_procedure_by_id(db, id, current_user)

#Rotta che permette di aggiornare una procedura esistente
@router.put("/{id}", response_model=schemas.ProcedureOut)
def update_procedure(
    id: str,
    request: Request,
    procedure: schemas.ProcedureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return procedure_service.update_procedure(id,ip_address,user_agent, procedure, db, current_user)

# Rotta che permette di eliminare una procedura esistente
@router.delete("/{id}")
def delete_procedure(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return procedure_service.delete_procedure(db,ip_address,user_agent, id, current_user)
