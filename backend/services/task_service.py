from statistics import mean
from uuid import UUID
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from api.endpoints.auth import get_current_user
from services.audit_logger import log_action
from services import notification_service
import models
import schemas
from db.database import get_db
from repository import procedure_repository, task_repository
from models.associations import task_user_assignments

PRIORITY_ORDER = ["critical", "high", "medium", "low"]


def _is_admin(user: models.User) -> bool:
    return user.role is not None and user.role.name == "Admin"


def _is_customer(user: models.User) -> bool:
    return user.role is not None and user.role.name == "Customer"


def get_all_tasks(db: Session, current_user: models.User):
    if _is_admin(current_user):
        return db.query(models.Task).all()

    if _is_customer(current_user):
        customer_procedure_ids = (
            db.query(models.Procedure.id)
            .filter(models.Procedure.customer_id == current_user.customer_id)
            .subquery()
        )
        return (
            db.query(models.Task)
            .filter(models.Task.procedure_id.in_(customer_procedure_ids))
            .filter(models.Task.requires_customer_input.is_(True))
            .all()
        )

    user_procedure_ids = (
        db.query(models.Procedure.id)
        .filter(models.Procedure.user_id == current_user.id)
        .subquery()
    )

    tasks_via_procedures = db.query(models.Task).filter(
        models.Task.procedure_id.in_(user_procedure_ids)
    )

    tasks_assigned = (
        db.query(models.Task)
        .join(task_user_assignments, models.Task.id == task_user_assignments.c.task_id)
        .filter(task_user_assignments.c.user_id == current_user.id)
    )

    return tasks_via_procedures.union(tasks_assigned).all()


def create_task_for_procedure(
    procedure_id: str,
    task_data: schemas.TaskCreate,
    ip_address: str,
    user_agent: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if _is_customer(current_user):
        raise HTTPException(status_code=403, detail="Il ruolo Customer non può creare task")
    procedure = procedure_repository.get_procedure_by_id(procedure_id, db)
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    new_task = models.Task(
        title=task_data.title,
        status=task_data.status,
        priority=task_data.priority,
        procedure_id=procedure_id,
        requires_customer_input=task_data.requires_customer_input
    )
    log_action(
        db, current_user, "TASK CREATED", ip_address, user_agent,
        "Tasks", procedure_id
    )
    db.commit()
    task_repository.save_new_task(db, new_task)
    return new_task


def get_tasks_for_procedure(
    procedure_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    procedure = procedure_repository.get_procedure_by_id(procedure_id, db)
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    if _is_customer(current_user):
        if procedure.customer_id != current_user.customer_id:
            raise HTTPException(status_code=403, detail="Non autorizzato ad accedere a questa procedura")
        return [t for t in procedure.tasks if t.requires_customer_input]
    return procedure.tasks


def update_task_status(
    task_id: str,
    status_update: schemas.TaskUpdateStatus,
    ip_address: str,
    user_agent: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_task = task_repository.get_task_by_id(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task non trovato")
    if _is_customer(current_user) and db_task.procedure.customer_id != current_user.customer_id:
        raise HTTPException(status_code=403, detail="Non autorizzato a modificare questo task")
    log_action(
        db, current_user, "TASK UPDATED", ip_address, user_agent,
        "Tasks", db_task.procedure_id
    )
    task_repository.update_task_status(db, db_task, status_update)
    return db_task


def submit_customer_response(
    task_id: str,
    response_update: schemas.TaskCustomerResponse,
    ip_address: str,
    user_agent: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not _is_customer(current_user):
        raise HTTPException(status_code=403, detail="Solo un utente con ruolo Customer può inviare questa risposta")
    db_task = task_repository.get_task_by_id(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task non trovato")
    if db_task.procedure.customer_id != current_user.customer_id:
        raise HTTPException(status_code=403, detail="Non autorizzato a modificare questo task")
    if not db_task.requires_customer_input:
        raise HTTPException(status_code=400, detail="Questo task non richiede dati dal cliente")
    db_task.customer_response = response_update.customer_response
    log_action(
        db, current_user, "TASK CUSTOMER RESPONSE", ip_address, user_agent,
        "Tasks", db_task.procedure_id
    )
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task_priority(
    task_id: str,
    priority_update: schemas.TaskUpdatePriority,
    db: Session,
    current_user: models.User,
):
    if _is_customer(current_user):
        raise HTTPException(status_code=403, detail="Il ruolo Customer non può modificare la priorità dei task")
    db_task = task_repository.get_task_by_id(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task non trovato")
    task_repository.update_task_priority(db, db_task, priority_update.priority)
    return db_task


def assign_user_to_task(
    task_id: str,
    user_id: UUID,
    db: Session,
    current_user: models.User,
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Solo gli admin possono assegnare task")

    task = task_repository.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task non trovato")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    if user not in task.assigned_users:
        task.assigned_users.append(user)
        db.commit()
        db.refresh(task)
        notification_service.create_notification(
            db=db,
            user_id=user.id,
            title="Nuovo task assegnato",
            message=f'Ti è stato assegnato il task "{task.title}"',
            type="task",
        )

    return task


def get_resolution_time_stats(db: Session, current_user: models.User):
    tasks = get_all_tasks(db, current_user)

    by_priority = {p: [] for p in PRIORITY_ORDER}
    for task in tasks:
        if task.completed_at and task.created_at and task.priority in by_priority:
            hours = (task.completed_at - task.created_at).total_seconds() / 3600
            by_priority[task.priority].append(hours)

    result = []
    overall = []
    for priority in PRIORITY_ORDER:
        hours_list = by_priority[priority]
        overall.extend(hours_list)
        result.append(schemas.PriorityResolutionOut(
            priority=priority,
            avg_hours=round(mean(hours_list), 1) if hours_list else None,
            count=len(hours_list),
        ))

    return schemas.ResolutionTimeStatsOut(
        by_priority=result,
        overall_avg_hours=round(mean(overall), 1) if overall else None,
        resolved_count=len(overall),
    )


def unassign_user_from_task(
    task_id: str,
    user_id: str,
    db: Session,
    current_user: models.User,
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Solo gli admin possono rimuovere assegnazioni")

    task = task_repository.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task non trovato")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    if user in task.assigned_users:
        task.assigned_users.remove(user)
        db.commit()
        db.refresh(task)

    return task
