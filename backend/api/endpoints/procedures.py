from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Request, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_approved_user
from services import procedure_service, translation_service

router = APIRouter()

#Creazione nuova procedura, richiede autenticazione
@router.post("/", response_model=schemas.ProcedureOut)
def create_procedure(
    procedure: schemas.ProcedureCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return procedure_service.create_procedure(procedure,ip_address,user_agent, db, current_user)

#Recupero tutte le procedure. Se page/page_size non sono passati, restituisce
#tutto (retrocompatibile per i consumer che hanno bisogno della lista intera:
#dropdown, dashboard, grafici). Passando page/page_size si attiva la paginazione
#(usata dalla griglia di ProcedureList), con ricerca opzionale per titolo.
@router.get("/", response_model=schemas.PaginatedProceduresOut)
def get_all_procedures(
    lang: Optional[str] = Query(None),
    page: Optional[int] = Query(default=None, ge=1),
    page_size: Optional[int] = Query(default=None, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user)
):
    query = db.query(models.Procedure)
    if current_user.role and current_user.role.name == "Customer":
        query = query.filter(models.Procedure.customer_id == current_user.customer_id)
    if search:
        query = query.filter(models.Procedure.title.ilike(f"%{search}%"))
    query = query.order_by(models.Procedure.created_at.desc())

    total = query.count()
    if page is not None or page_size is not None:
        effective_page = page or 1
        effective_size = page_size or 25
        procedures = query.offset((effective_page - 1) * effective_size).limit(effective_size).all()
    else:
        effective_page = 1
        effective_size = total
        procedures = query.all()

    if not lang:
        items = procedures
    else:
        translated = translation_service.get_translated_procedures(db, procedures, lang)
        items = []
        for proc in procedures:
            out = schemas.ProcedureOut.model_validate(proc).model_dump()
            title, description = translated[proc.id]
            out["title"] = title
            out["description"] = description
            items.append(out)

    return schemas.PaginatedProceduresOut(items=items, total=total, page=effective_page, page_size=effective_size)


#Conteggio procedure per lingua, per il grafico in Analytics
@router.get("/stats/by-language", response_model=List[schemas.LanguageCountOut])
def get_procedures_by_language(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user),
):
    rows = (
        db.query(models.Procedure.language, func.count(models.Procedure.id))
        .group_by(models.Procedure.language)
        .order_by(func.count(models.Procedure.id).desc())
        .all()
    )
    return [schemas.LanguageCountOut(language=language, count=count) for language, count in rows]


#Conteggio procedure create per giorno (ultimi N giorni), per il grafico trend in Analytics
@router.get("/stats/created-trend", response_model=List[schemas.DateCountOut])
def get_procedures_created_trend(
    days: int = Query(default=14, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user),
):
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days - 1)

    rows = (
        db.query(func.date(models.Procedure.created_at).label("day"), func.count(models.Procedure.id))
        .filter(func.date(models.Procedure.created_at) >= start)
        .group_by("day")
        .all()
    )
    counts = {str(day): count for day, count in rows}

    result = []
    for i in range(days):
        d = start + timedelta(days=i)
        key = str(d)
        result.append(schemas.DateCountOut(date=key, count=counts.get(key, 0)))
    return result

#Recupero una determinata procedura tramite id
@router.get("/{id}", response_model=schemas.ProcedureOut)
def get_procedure_by_id(
    id: str,
    lang: Optional[str] = Query(None),
    db: Session= Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user)
):
    procedure = procedure_service.get_procedure_by_id(db, id, current_user)
    if not lang or lang == procedure.language:
        return procedure
    translated = translation_service.get_translated_procedures(db, [procedure], lang)
    out = schemas.ProcedureOut.model_validate(procedure).model_dump()
    title, description = translated[procedure.id]
    out["title"] = title
    out["description"] = description
    return out

#Rotta che permette di aggiornare una procedura esistente
@router.put("/{id}", response_model=schemas.ProcedureOut)
def update_procedure(
    id: str,
    request: Request,
    procedure: schemas.ProcedureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user)
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
    current_user: models.User = Depends(get_current_approved_user)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return procedure_service.delete_procedure(db,ip_address,user_agent, id, current_user)


# ── Steps endpoints ─────────────────────────────────────────────────────────

@router.get("/{procedure_id}/steps", response_model=List[schemas.ProcedureStepOut])
def get_steps_for_procedure(
    procedure_id: str,
    lang: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user)
):
    """Returns steps from the latest version of a procedure."""
    latest_version = (
        db.query(models.ProcedureVersion)
        .filter(models.ProcedureVersion.procedure_id == procedure_id)
        .order_by(models.ProcedureVersion.created_at.desc())
        .first()
    )
    if not latest_version:
        return []
    steps = sorted(latest_version.steps, key=lambda s: s.step_number or 0)

    procedure = db.query(models.Procedure).filter(models.Procedure.id == procedure_id).first()
    if not lang or not procedure or lang == procedure.language:
        return steps

    translated = translation_service.get_translated_steps(db, steps, lang)
    results = []
    for step in steps:
        out = schemas.ProcedureStepOut.model_validate(step).model_dump()
        title, description = translated[step.id]
        out["title"] = title
        out["description"] = description
        results.append(out)
    return results


@router.patch("/steps/{step_id}/status", response_model=schemas.ProcedureStepOut)
def update_step_status(
    step_id: str,
    status_update: schemas.TaskUpdateStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user)
):
    """Toggle step status: todo → inprogress → done."""
    step = db.query(models.ProcedureStep).filter(models.ProcedureStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step non trovato")
    if current_user.role and current_user.role.name == "Customer":
        if step.version.procedure.customer_id != current_user.customer_id:
            raise HTTPException(status_code=403, detail="Non autorizzato a modificare questo step")
    step.status = status_update.status
    db.commit()
    db.refresh(step)
    return step
