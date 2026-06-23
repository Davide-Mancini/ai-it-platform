from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user
from services import task_service

router = APIRouter()

#rotta che cre un nuovo task associato ad una procedura esistente
@router.post("/procedures/{procedure_id}/tasks", response_model=schemas.TaskOut)
def create_task_for_procedure(
    procedure_id: str,
    task_data: schemas.TaskCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return task_service.create_task_for_procedure(procedure_id, task_data,ip_address=client_ip,user_agent=user_agent, db=db, current_user=current_user)


#rotta che recupera tutti i task di una determinata procedura
@router.get("/procedures/{procedure_id}/tasks", response_model=List[schemas.TaskOut])
def get_tasks_for_procedure(
    procedure_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return task_service.get_tasks_for_procedure(procedure_id, db, current_user)

#rotta che permette di aggiornare lo stato di un task esistente,tramite patch per aggiornare solo il campo status
@router.patch("/tasks/{task_id}/status", response_model=schemas.TaskOut)
def update_task_status(
    task_id: str,
    status_update: schemas.TaskUpdateStatus,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return task_service.update_task_status(task_id, status_update,ip_address,user_agent, db, current_user)
   
