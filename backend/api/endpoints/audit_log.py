from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, func, desc
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user
from services import audit_logger

router = APIRouter()


@router.get("/get_all", response_model=schemas.PaginatedAuditLogOut)
def get_all_audit_log(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not (current_user.role and current_user.role.name == "Admin"):
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    total, items = audit_logger.get_all_audit_log(db, page, page_size)
    return schemas.PaginatedAuditLogOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/recent", response_model=List[schemas.ActivityOut])
def get_recent_activity(
    limit: int = Query(default=10, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    is_admin = current_user.role and current_user.role.name == "Admin"

    base_query = (
        db.query(models.AuditLog, models.User)
        .outerjoin(models.User, models.AuditLog.user_id == models.User.id)
        .order_by(models.AuditLog.created_at.desc())
    )

    if is_admin:
        rows = base_query.limit(limit).all()
    else:
        # Raccoglie gli ID delle procedure dell'utente come stringhe
        procedure_ids = [
            str(p.id)
            for (p,) in db.query(models.Procedure.id)
            .filter(models.Procedure.user_id == current_user.id)
            .all()
        ]

        rows = (
            base_query
            .filter(
                or_(
                    models.AuditLog.user_id == current_user.id,
                    models.AuditLog.target_id.in_(procedure_ids),
                )
            )
            .limit(limit)
            .all()
        )

    return [
        schemas.ActivityOut(
            id=str(log.id),
            action=log.action,
            target_type=log.target_type,
            created_at=log.created_at.isoformat(),
            user_first_name=user.first_name if user else None,
            user_last_name=user.last_name if user else None,
            user_email=log.user_email,
        )
        for log, user in rows
    ]


@router.get("/stats/actions", response_model=List[schemas.ActionCountOut])
def get_action_stats(
    limit: int = Query(default=6, le=20),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    is_admin = current_user.role and current_user.role.name == "Admin"

    query = db.query(
        models.AuditLog.action,
        func.count(models.AuditLog.id).label("count"),
    )

    if not is_admin:
        query = query.filter(models.AuditLog.user_id == current_user.id)

    rows = (
        query.group_by(models.AuditLog.action)
        .order_by(desc("count"))
        .limit(limit)
        .all()
    )

    return [schemas.ActionCountOut(action=action, count=count) for action, count in rows]
