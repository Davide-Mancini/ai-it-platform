from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from security.security import get_password_hash, create_access_token, verify_password, verify_access_token
import models
import schemas
from db.database import get_db

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    email = verify_access_token(token)
    if email is None:
        raise HTTPException(status_code=401, detail="Token non valido")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    return user


#Creazione di un nuovo utente con controllo sull'email
@router.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    #Qui creo una variabile che contiene il risultato del controllo sulla email
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    #Se l'email e gia presente lancio un'ecceizione
    if db_user:
        raise HTTPException(status_code=400, detail="Email già registrata")
    #cripto la password utilizzando la funzione importatata da security
    hashed_password = get_password_hash(user.password)
    #creo un nuovo oggetto con i dati forniti
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

#Recupero la lsta di tutti gli utenti nel db
@router.get("/users/", response_model=List[schemas.UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

#funzione per il login verifica credenziali e genera token di accesso
@router.post("/login", response_model=schemas.Token)
def login(
    #Utilizzo la classe di fastapi per gestire i dati di login (email e password)
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    #Creo una variabile che contiene il risultato della query al db per trovare l'utente con l'email fornita
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    #se l'utente non esiste o la password e sbagliata lancio eccezione con messaggio
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenziali non valide"
        )
    #genero un token utilizzando la funzione importata da security, includendo l'email dell'utente come dato nel token
    access_token = create_access_token(data={"sub": user.email})
    #ritorno il token
    return {"access_token": access_token, "token_type": "bearer"}

#rotta che restituisce informazione sul'utente autenticato, utile nel frontend per mostrare il nome dell'utente o il suo ruolo
@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"message": f"Benvenuto {current_user.email}", "role": current_user.role}
