from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
from db.database import get_db, SessionLocal
from services import procedure_review_service
from services.gemini_service import RoleChecker
from services.rate_limiter import RateLimiter

router = APIRouter()

allow_it_staff = RoleChecker(["Admin", "IT Manager"])
review_rate_limit = RateLimiter(max_calls=1, period_seconds=300)


def _execute_run_job(run_id):
    # Il run e' gia' stato creato in modo sincrono (cosi' l'endpoint puo' restituirne subito l'id);
    # qui eseguiamo la revisione vera e propria in background, in una sessione DB dedicata.
    db = SessionLocal()
    try:
        procedure_review_service.execute_run_by_id(db, run_id)
    finally:
        db.close()


@router.post("/run", response_model=schemas.ReviewRunTriggerOut, status_code=status.HTTP_202_ACCEPTED)
def trigger_review(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_staff),
    _rate_limit: models.User = Depends(review_rate_limit),
):
    run = procedure_review_service.create_run(db, "manual", current_user.id)
    background_tasks.add_task(_execute_run_job, run.id)
    return schemas.ReviewRunTriggerOut(run_id=run.id, status=run.status)


@router.get("/runs", response_model=List[schemas.ProcedureReviewRunOut])
def get_runs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_staff),
):
    items, _ = procedure_review_service.list_runs(db, page, page_size)
    return items


@router.get("/runs/{run_id}", response_model=schemas.ProcedureReviewRunOut)
def get_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_staff),
):
    return procedure_review_service.get_run(db, run_id)


@router.get("/findings", response_model=schemas.PaginatedFindingsOut)
def get_findings(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    severity: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_staff),
):
    items, total = procedure_review_service.list_findings(db, status_filter, severity, page, page_size)
    return schemas.PaginatedFindingsOut(items=items, total=total, page=page, page_size=page_size)


@router.post("/findings/{finding_id}/accept", response_model=schemas.ProcedureVersionPut, status_code=status.HTTP_201_CREATED)
def accept_finding(
    finding_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_staff),
):
    return procedure_review_service.accept_finding(db, finding_id, current_user)


@router.post("/findings/{finding_id}/reject", response_model=schemas.ProcedureReviewFindingOut)
def reject_finding(
    finding_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_staff),
):
    finding = procedure_review_service.dismiss_finding(db, finding_id, current_user)
    return procedure_review_service.finding_to_out(finding)
