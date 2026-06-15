from services import gemini_service
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from db.database import get_db

router = APIRouter()

#Rotta per generare le procedure tramite l'ai
@router.post("/generate", response_model=schemas.ProcedureOut)
def generate_procedure_with_ai(
    payload: schemas.AIRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(gemini_service.allow_it_creators)
):
    #Richiamo la funzione scritta all'interno dei service
    new_ai_procedure = gemini_service.generate_procedure_with_ai(payload, db, current_user)
    return new_ai_procedure