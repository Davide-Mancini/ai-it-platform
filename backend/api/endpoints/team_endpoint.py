from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user
from models.associations import task_user_assignments as tua

router = APIRouter()


@router.get("/collaborators", response_model=List[schemas.CollaboratorOut])
def get_collaborators(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # ID delle mie procedure
    my_proc_ids = [
        p for (p,) in
        db.query(models.Procedure.id)
        .filter(models.Procedure.user_id == current_user.id)
        .all()
    ]

    # Caso 1: utenti assegnati a task delle mie procedure
    case1_ids = set()
    if my_proc_ids:
        rows = (
            db.query(tua.c.user_id)
            .join(models.Task, models.Task.id == tua.c.task_id)
            .filter(models.Task.procedure_id.in_(my_proc_ids))
            .filter(tua.c.user_id != current_user.id)
            .distinct()
            .all()
        )
        case1_ids = {uid for (uid,) in rows}

    # Caso 2: proprietari di procedure su cui sono assegnato come task
    my_assigned_proc_ids = [
        p for (p,) in
        db.query(models.Task.procedure_id)
        .join(tua, models.Task.id == tua.c.task_id)
        .filter(tua.c.user_id == current_user.id)
        .distinct()
        .all()
    ]

    case2_ids = set()
    if my_assigned_proc_ids:
        rows = (
            db.query(models.Procedure.user_id)
            .filter(models.Procedure.id.in_(my_assigned_proc_ids))
            .filter(models.Procedure.user_id != current_user.id)
            .distinct()
            .all()
        )
        case2_ids = {uid for (uid,) in rows}

    all_collab_ids = list(case1_ids | case2_ids)
    if not all_collab_ids:
        return []

    collaborators = (
        db.query(models.User)
        .filter(models.User.id.in_(all_collab_ids))
        .all()
    )

    # Conta task condivisi per ogni collaboratore
    result = []
    for collab in collaborators:
        # Task delle mie procedure assegnati a questo collaboratore
        count = (
            db.query(tua.c.task_id)
            .join(models.Task, models.Task.id == tua.c.task_id)
            .filter(tua.c.user_id == collab.id)
            .filter(
                models.Task.procedure_id.in_(my_proc_ids) if my_proc_ids
                else models.Task.procedure_id == None
            )
            .count()
        )

        # Task delle procedure di questo collaboratore assegnati a me
        collab_proc_ids = [
            p for (p,) in
            db.query(models.Procedure.id)
            .filter(models.Procedure.user_id == collab.id)
            .all()
        ]
        if collab_proc_ids:
            count += (
                db.query(tua.c.task_id)
                .join(models.Task, models.Task.id == tua.c.task_id)
                .filter(tua.c.user_id == current_user.id)
                .filter(models.Task.procedure_id.in_(collab_proc_ids))
                .count()
            )

        result.append(schemas.CollaboratorOut(
            id=str(collab.id),
            first_name=collab.first_name,
            last_name=collab.last_name,
            email=collab.email,
            role=collab.role.name if collab.role else None,
            is_active=collab.is_active,
            shared_tasks_count=count,
        ))

    result.sort(key=lambda c: c.shared_tasks_count, reverse=True)
    return result
