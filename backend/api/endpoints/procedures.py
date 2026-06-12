from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user

router = APIRouter()

#Creazione nuova procedura, richiede autenticazione
@router.post("/", response_model=schemas.ProcedureOut)
def create_procedure(
    procedure: schemas.ProcedureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    #Creo un nuovo oggetto procedura con i dati forniti come parametro e l'id dell'utente corrente come autore
    new_procedure = models.Procedure(
        title=procedure.title,
        description=procedure.description,
        user_id=current_user.id
    )
    #Aggiungo la procedura creata al db
    db.add(new_procedure)
    #Salvo le modifiche 
    db.commit()
    #Aggiorno con i dati appena salvati
    db.refresh(new_procedure)
    return new_procedure

#Recupero tutte le procedure
@router.get("/", response_model=List[schemas.ProcedureOut])
def get_all_procedures(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Procedure).all()

#Recupero una determinata procedura tramite id
@router.get("/{id}", response_model=schemas.ProcedureOut)
def get_procedure_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    #creo variabile che contiene il risultato della query
    procedure = db.query(models.Procedure).filter(models.Procedure.id == id).first()
    #se la procedura torna false lancio eccezione con messaggio
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    return procedure

#Rotta che permette di aggiornare una procedura esistente
@router.put("/{id}", response_model=schemas.ProcedureOut)
def update_procedure(
    id: str,
    procedure_data: schemas.ProcedureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    #creo variabile che contiene il risultato della query per trovare la procedura da aggiornare
    db_procedure = db.query(models.Procedure).filter(models.Procedure.id == id).first()
    #se la procedura torna false lancio eccezione con messaggio
    if not db_procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    #altrimenti aggiorno i campi con i dati forniti come parametro
    db_procedure.title = procedure_data.title
    db_procedure.description = procedure_data.description
    #salvo modifche nel db
    db.commit()
    db.refresh(db_procedure)
    return db_procedure

# Rotta che permette di eliminare una procedura esistente
@router.delete("/{id}")
def delete_procedure(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    #creo variabile che contiene il risultato della query per trovare la procedura da eliminare
    db_procedure = db.query(models.Procedure).filter(models.Procedure.id == id).first()
    #se la procedura torna false lancio eccezione con messaggio
    if not db_procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    #altrimenti elimino la procedura dal db
    db.delete(db_procedure)
    db.commit()
    return {"detail": f"Procedura con ID {id} eliminata con successo"}
