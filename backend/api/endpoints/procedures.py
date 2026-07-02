from fastapi import APIRouter, Depends, Request, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user
from services import procedure_service, translation_service

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
    lang: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    procedures = db.query(models.Procedure).all()
    if not lang:
        return procedures
    translated = translation_service.get_translated_procedures(db, procedures, lang)
    results = []
    for proc in procedures:
        out = schemas.ProcedureOut.model_validate(proc).model_dump()
        title, description = translated[proc.id]
        out["title"] = title
        out["description"] = description
        results.append(out)
    return results

#Recupero una determinata procedura tramite id
@router.get("/{id}", response_model=schemas.ProcedureOut)
def get_procedure_by_id(
    id: str,
    lang: Optional[str] = Query(None),
    db: Session= Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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


# ── Steps endpoints ─────────────────────────────────────────────────────────

@router.get("/{procedure_id}/steps", response_model=List[schemas.ProcedureStepOut])
def get_steps_for_procedure(
    procedure_id: str,
    lang: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
):
    """Toggle step status: todo → inprogress → done."""
    step = db.query(models.ProcedureStep).filter(models.ProcedureStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step non trovato")
    step.status = status_update.status
    db.commit()
    db.refresh(step)
    return step
