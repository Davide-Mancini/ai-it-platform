from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from api.endpoints.auth import get_current_user
from services.audit_logger import log_action
import models
import schemas
from db.database import get_db
from repository import procedure_repository


def create_procedure(
    procedure: schemas.ProcedureCreate,
    ip_address: str,
    user_agent: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    #Creo un nuovo oggetto procedura con i dati forniti come parametro e l'id dell'utente corrente come autore
    new_procedure = models.Procedure(
        title=procedure.title,
        description=procedure.description,
        user_id=current_user.id
    )
    
    log_action(
            db, current_user, "PROCEDURE CREATED", ip_address, user_agent,
            "Procedure", current_user.id
        )
    db.commit()
    #Aggiungo la procedura creata al db
    procedure_repository.save_new_procedure(db, new_procedure)
    return new_procedure


def get_procedure_by_id(
    id: str,
    db: Session,
    current_user: models.User = Depends(get_current_user)
):
    #creo variabile che contiene il risultato della query
    procedure = procedure_repository.get_procedure_by_id(db,id)
    #se la procedura torna false lancio eccezione con messaggio
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    return procedure

def update_procedure(
    id: str,
    ip_address: str,
    user_agent: str,
    procedure_data: schemas.ProcedureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    #creo variabile che contiene il risultato della query per trovare la procedura da aggiornare
    db_procedure = get_procedure_by_id(db,id)
    #se la procedura torna false lancio eccezione con messaggio
    if not db_procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    #altrimenti aggiorno i campi con i dati forniti come parametro
    db_procedure.title = procedure_data.title
    db_procedure.description = procedure_data.description
    #salvo modifche nel db
    log_action(
            db, current_user, "PROCEDURE UPDATED", ip_address, user_agent,
            "Procedure", current_user.id
        )
  
    db.commit()
    db.refresh(db_procedure)
    return db_procedure

def delete_procedure(
    db: Session,
    ip_address: str,
    user_agent: str,
    id: str,
    current_user: models.User = Depends(get_current_user)
):
    #creo variabile che contiene il risultato della query per trovare la procedura da eliminare
    db_procedure = get_procedure_by_id(db,id)
    #se la procedura torna false lancio eccezione con messaggio
    if not db_procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    
    #altrimenti elimino la procedura dal db
    procedure_repository.delete_procedure_by_id(db,db_procedure)
    
    log_action(
            db, current_user, "PROCEDURE DELETED", ip_address, user_agent,
            "Procedure", current_user.id
        )
    db.commit()
    return {"detail": f"Procedura con ID {id} eliminata con successo"}


