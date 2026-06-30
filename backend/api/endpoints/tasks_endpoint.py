from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user
from services import task_service

router = APIRouter()


@router.get("/", response_model=List[schemas.TaskOut])
def get_all_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return task_service.get_all_tasks(db, current_user)


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
    return task_service.create_task_for_procedure(procedure_id, task_data, ip_address=client_ip, user_agent=user_agent, db=db, current_user=current_user)


@router.get("/procedures/{procedure_id}/tasks", response_model=List[schemas.TaskOut])
def get_tasks_for_procedure(
    procedure_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return task_service.get_tasks_for_procedure(procedure_id, db, current_user)


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
    return task_service.update_task_status(task_id, status_update, ip_address, user_agent, db, current_user)


@router.patch("/tasks/{task_id}/priority", response_model=schemas.TaskOut)
def update_task_priority(
    task_id: str,
    priority_update: schemas.TaskUpdatePriority,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return task_service.update_task_priority(task_id, priority_update, db, current_user)


@router.post("/tasks/{task_id}/assign", response_model=schemas.TaskOut)
def assign_user_to_task(
    task_id: str,
    assign_data: schemas.TaskAssign,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return task_service.assign_user_to_task(task_id, assign_data.user_id, db, current_user)


@router.delete("/tasks/{task_id}/assign/{user_id}", response_model=schemas.TaskOut)
def unassign_user_from_task(
    task_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return task_service.unassign_user_from_task(task_id, user_id, db, current_user)
