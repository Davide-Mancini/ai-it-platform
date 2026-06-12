from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user

router = APIRouter()


@router.post("/procedures/{procedure_id}/tasks", response_model=schemas.TaskOut)
def create_task_for_procedure(
    procedure_id: str,
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    procedure = db.query(models.Procedure).filter(models.Procedure.id == procedure_id).first()
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    new_task = models.Task(
        title=task_data.title,
        status=task_data.status,
        procedure_id=procedure_id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.get("/procedures/{procedure_id}/tasks", response_model=List[schemas.TaskOut])
def get_tasks_for_procedure(
    procedure_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    procedure = db.query(models.Procedure).filter(models.Procedure.id == procedure_id).first()
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    return procedure.tasks


@router.patch("/tasks/{task_id}/status", response_model=schemas.TaskOut)
def update_task_status(
    task_id: str,
    status_update: schemas.TaskUpdateStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task non trovato")
    db_task.status = status_update.status
    db.commit()
    db.refresh(db_task)
    return db_task
