from enums import UserRole
from services import gemini_service
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from db.database import get_db
from fastapi import status
import json
from models import AIRecommendation


router = APIRouter()

# Solo Administrator e IT Manager possono approvare o rifiutare le procedure dell'IA
allow_it_creators = gemini_service.RoleChecker(["Admin", "IT Manager"])

#Rotta per generare le procedure tramite l'ai
@router.post("/generate", response_model=schemas.AIRecommendationOut)
def generate_procedure_with_ai(
    payload: schemas.AIRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(gemini_service.allow_it_creators)
):
    #Richiamo la funzione scritta all'interno dei service
    new_ai_procedure = gemini_service.generate_procedure_with_ai(payload, db, current_user)
    return new_ai_procedure

#I tuoi endpoint ottimizzati
@router.post("/recommendations/{recommendation_id}/accept", status_code=status.HTTP_201_CREATED)
def accept_recommendation(
    recommendation_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_creators)
):
    # Recuperiamo la raccomandazione dal DB
    recommendation = db.query(AIRecommendation).filter(
        models.AIRecommendation.id == recommendation_id
    ).first()
    
    if not recommendation:
        raise HTTPException(status_code=404, detail="Raccomandazione non trovata.")
        
    if recommendation.is_accepted is not None:
        raise HTTPException(status_code=400, detail="Questa raccomandazione è già stata elaborata.")

    # Convertiamo la stringa di testo (JSON) in un dizionario Python
    try:
        procedure_data = json.loads(recommendation.output_text)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, 
            detail="Errore critico: il formato dei dati memorizzati dall'IA non è un JSON valido."
        )

    try:
        # Creiamo la vera Procedura ufficiale nel DB
        new_procedure = models.Procedure(
            title=procedure_data.get("title"),
            description=procedure_data.get("description"),
            user_id=recommendation.user_id # Manteniamo l'autore originale
        )
        db.add(new_procedure)
        db.flush() # Genera l'ID di new_procedure senza fare il commit definitivo

        # Cicliamo sui task estratti dal JSON e li colleghiamo alla procedura
        for task_item in procedure_data.get("tasks", []):
            new_task = models.Task(
                title=task_item.get("title"),
                status="pending", # Stato iniziale coerente con il tuo db
                procedure_id=new_procedure.id
            )
            db.add(new_task)

        # Aggiorniamo lo stato della raccomandazione a True (Accettata)
        recommendation.is_accepted = True
        
        # Salviamo tutto definitivamente con un unico commit atomico
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore durante il salvataggio definitivo: {str(e)}")

    return {"message": "Procedura e task approvati e creati con successo!", "procedure_id": new_procedure.id}


@router.post("/recommendations/{recommendation_id}/reject")
def reject_recommendation(
    recommendation_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_creators)
):
    # Recuperiamo la raccomandazione
    recommendation = db.query(models.AIRecommendation).filter(
        AIRecommendation.id == recommendation_id
    ).first()
    
    if not recommendation:
        raise HTTPException(status_code=404, detail="Raccomandazione non trovata.")
        
    if recommendation.is_accepted is not None:
        raise HTTPException(status_code=400, detail="Questa raccomandazione è già stata elaborata.")

    # Cambiamo semplicemente il booleano a False (Rifiutata)
    recommendation.is_accepted = False
    db.commit()

    return {"message": "Raccomandazione scartata. Le tabelle Procedures e Tasks sono rimaste pulite."}
