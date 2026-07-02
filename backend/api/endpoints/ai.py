from services import gemini_service
from fastapi import APIRouter, Depends, HTTPException,Request
from sqlalchemy.orm import Session
import models
import schemas
from db.database import get_db
from fastapi import status
import json
from models import AIRecommendation
from services.audit_logger import log_action

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


@router.post("/recommendations/{recommendation_id}/accept", status_code=status.HTTP_201_CREATED)
def accept_recommendation(
    recommendation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_creators)
):
    # Recupero la raccomandazione dal DB
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
            user_id=recommendation.user_id,
            language=recommendation.language
        )
        db.add(new_procedure)
        db.flush()

        new_version = models.ProcedureVersion(
            procedure_id=new_procedure.id,
            version_number="1.0.0",
            status="published",
            created_by_id=current_user.id
        )
        db.add(new_version)
        db.flush()

        # Carico tutti i documenti indicizzati per titolo per un lookup O(1)
        all_documents = db.query(models.Document).all()
        doc_by_title = {doc.title: doc for doc in all_documents}

        for step_item in procedure_data.get("tasks", []):
            new_step = models.ProcedureStep(
                version_id=new_version.id,
                step_number=step_item["step_number"],
                title=step_item["title"],
                description=step_item["description"]
            )
            db.add(new_step)
            db.flush()

            for doc_title in step_item.get("relevant_document_titles", []):
                doc = doc_by_title.get(doc_title)
                if doc:
                    new_step.documents.append(doc)

        recommendation.is_accepted = True

        log_action(
            db, current_user, "AI_RECOMMENDATION_ACCEPTED",
            request.client.host if request.client else None,
            request.headers.get("user-agent"),
            "Procedure",
            new_procedure.id,
            {"recommendation_id": recommendation_id}
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore durante il salvataggio definitivo: {str(e)}")
    
  
    return {
            "status": "success",
            "message": "Procedura, versione e step salvati correttamente!",
            "procedure_id": new_procedure.id,
            "version_id": new_version.id
        }


@router.post("/recommendations/{recommendation_id}/reject")
def reject_recommendation(
    recommendation_id: str,
    request: Request,
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
    log_action(
        db, current_user, "AI_RECOMMENDATION_REJECTED",
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        "Procedure",
        recommendation.id,
        {"recommendation_id": recommendation_id}
    )
    db.commit()

    return {"message": "Raccomandazione scartata. Le tabelle Procedures e Tasks sono rimaste pulite."}
