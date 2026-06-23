import os
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: models.User = Depends(get_current_user)):
        user_role_name = current_user.role.name if hasattr(current_user.role, 'name') else current_user.role

        if user_role_name not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Operazione non autorizzata per il tuo livello di account."
            )
        return current_user


allow_it_creators = RoleChecker(["Admin", "IT Manager"])
ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def _build_kb_context(kb_items: list) -> str:
    if not kb_items:
        return ""
    lines = []
    for item in kb_items:
        tags_str = ", ".join(item.tags) if item.tags else ""
        lines.append(f'- [{item.category}] {item.title}{f" (tag: {tags_str})" if tags_str else ""}: {item.content}')
    kb_block = "\n".join(lines)
    return (
        f"\n\n=== KNOWLEDGE BASE AZIENDALE ===\n{kb_block}\n\n"
        "Dove pertinente, integra nelle descrizioni degli step le soluzioni e i comandi "
        "già documentati nella knowledge base aziendale riportata sopra."
    )


def _build_doc_context(docs: list) -> str:
    if not docs:
        return ""
    lines = []
    for doc in docs:
        content_preview = (doc.content[:600] + "...") if doc.content and len(doc.content) > 600 else (doc.content or "")
        lines.append(f'### "{doc.title}"\n{content_preview}')
    doc_block = "\n\n".join(lines)
    return (
        f"\n\n=== DOCUMENTI DI RIFERIMENTO NEL SISTEMA ===\n{doc_block}\n\n"
        "Per ogni step della procedura, indica nel campo 'relevant_document_titles' i titoli "
        "(copiati esattamente) dei documenti sopra elencati che sono pertinenti a quello step. "
        "Se nessun documento è pertinente, lascia la lista vuota."
    )


def _build_policy_context(policies: list) -> str:
    if not policies:
        return ""
    lines = []
    for pol in policies:
        lines.append(f"- [{pol.category}] {pol.title}: {pol.description}")
    policy_block = "\n".join(lines)
    return (
        f"\n\n=== POLICY AZIENDALI ATTIVE (VINCOLI OBBLIGATORI) ===\n{policy_block}\n\n"
        "IMPORTANTE: la procedura generata DEVE essere conforme a tutte le policy elencate sopra. "
        "Se una policy è rilevante per uno step specifico, citala esplicitamente nella descrizione dello step."
    )


def generate_procedure_with_ai(
    payload: schemas.AIRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_creators)
):
    user_id = current_user.id

    available_docs = db.query(models.Document).all()
    active_policies = db.query(models.Policy).filter(models.Policy.is_active == True).all()
    kb_items = db.query(models.KnowledgeBaseItem).all()

    doc_context = _build_doc_context(available_docs)
    policy_context = _build_policy_context(active_policies)
    kb_context = _build_kb_context(kb_items)

    prompt_sistema = (
        "Sei un esperto di IT Operations, Cloud Architect e SysAdmin Senior con profonda conoscenza "
        "di normative di compliance (GDPR, ISO 27001, ISO 20000) e best practice ITIL.\n"
        "Il tuo compito è generare procedure tecniche operative dettagliate basate sulla richiesta dell'utente.\n"
        "Devi tassativamente suddividere la procedura in passaggi logici sequenziali (steps).\n"
        "Ogni step deve contenere un titolo chiaro, un numero progressivo (partendo da 1) e una descrizione "
        "tecnica accurata che includa eventuali comandi o azioni atomiche da compiere.\n"
        "Rispondi esclusivamente in lingua italiana."
        + policy_context
        + kb_context
        + doc_context
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
        new_reccomendation = models.AIRecommendation(
            user_id=user_id,
            context_type="procedure_generation",
            input_data=payload.prompt,
            output_text=ai_response.model_dump_json(),
            is_accepted=None
        )
        db.add(new_reccomendation)
        db.commit()
        db.refresh(new_reccomendation)
    except Exception as db_err:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Errore nel salvataggio: {db_err}")

    return new_reccomendation
