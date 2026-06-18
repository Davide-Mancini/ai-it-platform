from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from api.endpoints.auth import get_current_user
from services.audit_logger import log_action
from security.security import get_password_hash, create_access_token, verify_password, verify_access_token
import models
import schemas
from db.database import get_db
from repository import procedure_repository,task_repository


def create_task_for_procedure(
    procedure_id: str,
    task_data: schemas.TaskCreate,
    ip_address: str,
    user_agent: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    #variabile che contiene il risultato della query per trovare la procedura a cui associare il task
    procedure = procedure_repository.get_procedure_by_id(procedure_id,db)
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    new_task = models.Task(
        title=task_data.title,
        status=task_data.status,
        procedure_id=procedure_id
    )
    log_action(
            db, current_user, "TASK CREATED", ip_address, user_agent,
             "Tasks", current_user.id
        )
    db.commit()
    task_repository.save_new_task(db,new_task)
    return new_task


def get_tasks_for_procedure(
    procedure_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    procedure = procedure_repository.get_procedure_by_id(procedure_id,db)
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    return procedure.tasks



def update_task_status(
    task_id: str,
    status_update: schemas.TaskUpdateStatus,
    ip_address: str,
    user_agent: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_task = task_repository.get_task_by_id(db,task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task non trovato")
    log_action(
            db, current_user, "TASK UPDATED", ip_address, user_agent,
             "Tasks", current_user.id
        )
    task_repository.update_task_status(db,db_task,status_update)
    return db_task