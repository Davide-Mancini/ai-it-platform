from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=schemas.ProcedureOut)
def create_procedure(
    procedure: schemas.ProcedureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_procedure = models.Procedure(
        title=procedure.title,
        description=procedure.description,
        user_id=current_user.id
    )
    db.add(new_procedure)
    db.commit()
    db.refresh(new_procedure)
    return new_procedure


@router.get("/", response_model=List[schemas.ProcedureOut])
def get_all_procedures(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Procedure).all()


@router.get("/{id}", response_model=schemas.ProcedureOut)
def get_procedure_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    procedure = db.query(models.Procedure).filter(models.Procedure.id == id).first()
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    return procedure


@router.put("/{id}", response_model=schemas.ProcedureOut)
def update_procedure(
    id: str,
    procedure_data: schemas.ProcedureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_procedure = db.query(models.Procedure).filter(models.Procedure.id == id).first()
    if not db_procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    db_procedure.title = procedure_data.title
    db_procedure.description = procedure_data.description
    db.commit()
    db.refresh(db_procedure)
    return db_procedure


@router.delete("/{id}")
def delete_procedure(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_procedure = db.query(models.Procedure).filter(models.Procedure.id == id).first()
    if not db_procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    db.delete(db_procedure)
    db.commit()
    return {"detail": f"Procedura con ID {id} eliminata con successo"}
