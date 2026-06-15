import os
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from enums import UserRole
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

router = APIRouter()


class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: models.User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Operazione non autorizzata per il tuo livello di account."
            )
        return current_user


allow_it_creators = RoleChecker([UserRole.ADMINISTRATOR, UserRole.IT_MANAGER])
ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))



def generate_procedure_with_ai(
    payload: schemas.AIRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_creators)
):
    user_id = current_user.id

    prompt_sistema = (
        "Sei un esperto di IT Operations e SysAdmin. Il tuo compito è generare procedure tecniche dettagliate "
        "e una lista di task operativi sequenziali basati sulla richiesta dell'utente. "
        "Rispondi esclusivamente in lingua italiana."
    )

    max_tentativi = 3
    tempo_attesa = 2
    ai_response = None

    for tentativo in range(max_tentativi):
        try:
            response = ai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"{prompt_sistema}\n\nGenera una procedura per: {payload.prompt}",
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schemas.AIProcedureResponse
                ),
            )
            ai_response = schemas.AIProcedureResponse.model_validate_json(response.text)
            break
        except Exception as e:
            if "503" in str(e) and tentativo < max_tentativi - 1:
                time.sleep(tempo_attesa)
                tempo_attesa *= 2
                continue
            raise HTTPException(status_code=500, detail=f"Errore nella generazione AI: {str(e)}")

    try:
        new_procedure = models.Procedure(
            title=ai_response.title,
            description=ai_response.description,
            user_id=user_id
        )
        db.add(new_procedure)
        db.flush()

        for task_data in ai_response.tasks:
            new_task = models.Task(
                title=task_data.title,
                status="pending",
                procedure_id=new_procedure.id
            )
            db.add(new_task)

        db.commit()
    except Exception as db_err:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore nel salvataggio a DB: {str(db_err)}")

    procedure_completa = db.query(models.Procedure)\
        .options(joinedload(models.Procedure.tasks))\
        .filter(models.Procedure.id == new_procedure.id)\
        .first()

    return procedure_completa
