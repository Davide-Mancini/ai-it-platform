from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from security import get_password_hash, create_access_token, verify_password
from fastapi.middleware.cors import CORSMiddleware
import models
import schemas
from database import engine, get_db
from security import verify_access_token
from schemas import ProcedureCreate, ProcedureOut, TaskCreate, TaskOut, TaskUpdateStatus



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