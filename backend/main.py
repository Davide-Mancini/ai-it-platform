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
from schemas import ProcedureCreate, ProcedureOut



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