from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from security.security import get_password_hash, create_access_token, verify_password, verify_access_token
import models
import schemas
from db.database import get_db
from services import auth_service

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
    return auth_service.create_user(user, db)
   

#Recupero la lsta di tutti gli utenti nel db
@router.get("/users/", response_model=List[schemas.UserOut])
def get_users(db: Session = Depends(get_db)):
    return auth_service.get_users(db)

#funzione per il login verifica credenziali e genera token di accesso
@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return auth_service.login(form_data, db)

#rotta che restituisce informazione sul'utente autenticato, utile nel frontend per mostrare il nome dell'utente o il suo ruolo
@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"message": f"Benvenuto {current_user.email}", "role": current_user.role}
