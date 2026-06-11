from datetime import time
import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic_core import ValidationError
from sqlalchemy.orm import Session
from typing import List
from enums import UserRole
from security import get_password_hash, create_access_token, verify_password
from fastapi.middleware.cors import CORSMiddleware
import models
import schemas
from sqlalchemy.orm import joinedload
from database import engine, get_db
from security import verify_access_token
from schemas import AIRequest,ProcedureCreate, ProcedureOut, TaskCreate, TaskOut, TaskUpdateStatus
from dotenv import load_dotenv
from google import genai
from google.genai import types
from fastapi import HTTPException, Depends
import json
load_dotenv()





# Questo comando dice a SQLAlchemy di creare fisicamente le tabelle nel DB 
# se non esistono ancora quando il server si avvia.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-Assisted IT Procedure Platform")
origins = [
    "http://localhost:3000",  # React app in sviluppo
    "http://localhost:5173",  # FastAPI in sviluppo
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
@app.get("/")
def home():
    return {"status": "running", "message": "Benvenuto nella piattaforma"}

# API per Creare un Utente (POST)
@app.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Controlliamo se l'email esiste già
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    hashed_password = get_password_hash(user.password) # Hash della password

    # NOTA: Per ora salviamo la password in chiaro per testare il flusso. 
    # Nel mese 2 inseriremo l'hashing con bcrypt per la sicurezza!
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )
    
    db.add(new_user) # Prepara la query di inserimento
    db.commit()      # Salva nel database
    db.refresh(new_user) # Recupera l'ID generato dal DB
    return new_user

# API per Elencare tutti gli Utenti (GET)
@app.get("/users/", response_model=List[schemas.UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

#Login
@app.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), # <--- Cambiato qui: legge il form del lucchetto
    db: Session = Depends(get_db)
):
    # Usiamo form_data.username (che conterrà l'email digitata nel lucchetto)
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # Controllo unico per sicurezza (evita di far capire se è sbagliata la mail o la password)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Credenziali non valide"
        )
        
    # Generiamo il token
    access_token = create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
@app.get("/users/me")
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = verify_access_token(token)
    if email is None:
        raise HTTPException(status_code=401, detail="Token non valido")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    return {"message": f"Benvenuto {user.email}", "role": user.role}

@app.post("/api/procedures", response_model=schemas.ProcedureOut)
def create_procedure(
    procedure: schemas.ProcedureCreate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme) # Obbliga a passare il token
):
    # Recuperiamo l'email dal token per capire chi sta scrivendo
    email = verify_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token non valido o scaduto")
    
    # Cerchiamo l'utente nel DB per avere il suo ID
    user = db.query(models.User).filter(models.User.email == email).first()
    
    # Creiamo la nuova procedura associandola all'utente corrente
    new_procedure = models.Procedure(
        title=procedure.title,
        description=procedure.description,
        user_id=user.id
    )
    
    db.add(new_procedure)
    db.commit()
    db.refresh(new_procedure)
    return new_procedure


# 3. Endpoint per LEGGERE tutte le procedure (Protetto da Token)
@app.get("/api/procedures", response_model=list[schemas.ProcedureOut])
def get_all_procedures(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    email = verify_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token non valido o scaduto")
        
    # Recupera tutte le procedure presenti nel database
    procedures = db.query(models.Procedure).all()
    return procedures

# 1. GET - RECUPERA UNA SINGOLA PROCEDURA TRAMITE ID
@app.get("/api/procedures/{id}", response_model=schemas.ProcedureOut)
def get_procedure_by_id(
    id: str, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    # Verifica token
    email = verify_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token non valido o scaduto")
        
    # Cerca la procedura nel DB
    procedure = db.query(models.Procedure).filter(models.Procedure.id == id).first()
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
        
    return procedure


# 2. PUT - MODIFICA UNA PROCEDURA ESISTENTE
@app.put("/api/procedures/{id}", response_model=schemas.ProcedureOut)
def update_procedure(
    id: str, 
    procedure_data: schemas.ProcedureCreate, # Riutilizziamo lo schema con title e description
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    email = verify_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token non valido o scaduto")
        
    # Cerca la procedura da modificare
    db_procedure = db.query(models.Procedure).filter(models.Procedure.id == id).first()
    if not db_procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
    
    # Aggiorna i campi con i nuovi dati in arrivo dal frontend
    db_procedure.title = procedure_data.title
    db_procedure.description = procedure_data.description
    
    db.commit()
    db.refresh(db_procedure)
    return db_procedure


# 3. DELETE - ELIMINA UNA PROCEDURA
@app.delete("/api/procedures/{id}")
def delete_procedure(
    id: str, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    email = verify_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token non valido o scaduto")
        
    # Cerca la procedura da eliminare
    db_procedure = db.query(models.Procedure).filter(models.Procedure.id == id).first()
    if not db_procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
        
    # Elimina dal database
    db.delete(db_procedure)
    db.commit()
    
    return {"detail": f"Procedura con ID {id} eliminata con successo"}

# 1. POST - AGGIUNGI UN TASK A UNA PROCEDURA SPECIFICA
@app.post("/api/procedures/{procedure_id}/tasks", response_model=schemas.TaskOut)
def create_task_for_procedure(
    procedure_id: str,
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    email = verify_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token non valido o scaduto")
        
    # Controlliamo prima se la procedura esiste davvero
    procedure = db.query(models.Procedure).filter(models.Procedure.id == procedure_id).first()
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
        
    # Creiamo il task
    new_task = models.Task(
        title=task_data.title,
        status=task_data.status,
        procedure_id=procedure_id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


# 2. GET - RECUPERA TUTTI I TASK DI UNA PROCEDURA
@app.get("/api/procedures/{procedure_id}/tasks", response_model=list[schemas.TaskOut])
def get_tasks_for_procedure(
    procedure_id: str,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    email = verify_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token non valido o scaduto")
        
    # Controlliamo se la procedura esiste
    procedure = db.query(models.Procedure).filter(models.Procedure.id == procedure_id).first()
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedura non trovata")
        
    return procedure.tasks


# 3. PATCH - AGGIORNA LO STATO DI UN SINGOLO TASK (Checklist)
@app.patch("/api/tasks/{task_id}/status", response_model=schemas.TaskOut)
def update_task_status(
    task_id: str,
    status_update: schemas.TaskUpdateStatus,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    email = verify_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token non valido o scaduto")
        
    # Cerchiamo il task specifico
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task non trovato")
        
    # Aggiorniamo solo lo stato (es. da "pending" a "completed")
    db_task.status = status_update.status
    db.commit()
    db.refresh(db_task)
    return db_task
class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        # Memorizza la lista dei ruoli autorizzati
        self.allowed_roles = allowed_roles

    def __call__(self, current_user = Depends(get_current_user)):
        # 1. Se current_user è un dizionario (es. payload del JWT)
        if isinstance(current_user, dict):
            user_role = current_user.get("role")
        # 2. Se invece è un oggetto del database (SQLAlchemy model)
        else:
            user_role = getattr(current_user, "role", None)

        # Controlla se il ruolo è presente tra quelli autorizzati
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=403, # 403 Forbidden (Riconosciuto ma non autorizzato)
                detail="Operazione non autorizzata per il tuo livello di account."
            )
            
        return current_user
allow_it_creators = RoleChecker([UserRole.ADMINISTRATOR, UserRole.IT_MANAGER])  
ai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
@app.post("/api/ai/generate", response_model=schemas.ProcedureOut)
@app.post("/api/ai/generate", response_model=schemas.ProcedureOut)
def generate_procedure_with_ai(
    payload: schemas.AIRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_creators)
):
    print("========================================")
    print("DEBUG CURRENT_USER DIZIONARIO:", current_user)
    print("========================================")

    if isinstance(current_user, dict):
        # Prendiamo la stringa "Benvenuto prova1@prova.it"
        message = current_user.get("message", "")
        # Rimuoviamo la parola "Benvenuto " per isolare solo l'email
        email = message.replace("Benvenuto ", "").strip()
    else:
        email = getattr(current_user, "email", None)

    # 🔍 Riga di controllo per essere sicuri al 100% nel terminale
    print(f"--- EMAIL ISOLATA CON SUCCESSO: '{email}' ---")
    # 2. Facciamo una query per prendere l'utente reale dal DB tramite l'email
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Utente non trovato nel database")
    
    # 3. Ora abbiamo la certezza matematica di avere il vero ID (sia esso int o str)
    user_id = db_user.id


    # ======================================================================
    # 2. CHIAMATA NATIVA A GEMINI CON RETRY AUTOMATICO (Resta invariato)
    # ======================================================================
    import time
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

    # ======================================================================
    # 3. SALVATAGGIO IN DATABASE (Resta invariato, userà lo user_id corretto)
    # ======================================================================
    try:
        new_procedure = models.Procedure(
            title=ai_response.title,
            description=ai_response.description,
            user_id=user_id  # <--- Qui passerà l'ID corretto recuperato dal DB
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

    # ======================================================================
    # 4. RITORNO DELLA PROCEDURA COMPLETA (Resta invariato)
    # ======================================================================
    from sqlalchemy.orm import joinedload
    procedure_completa = db.query(models.Procedure)\
        .options(joinedload(models.Procedure.tasks))\
        .filter(models.Procedure.id == new_procedure.id)\
        .first()

    return procedure_completa


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> models.User:
    email = verify_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token non valido o scaduto")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    return user
