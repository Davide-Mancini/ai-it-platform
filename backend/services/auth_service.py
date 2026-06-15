from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from security.security import get_password_hash, create_access_token, verify_password, verify_access_token
import models
import schemas
from db.database import get_db
from repository import auth_repository



def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    #Qui creo una variabile che contiene il risultato del controllo sulla email
    db_user = auth_repository.get_user_by_email(db,user.email)
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
    auth_repository.save_new_user(db, new_user)
    return new_user


def get_users(db: Session = Depends(get_db)):
    return auth_repository.get_all_users(db)


def login(
    #Utilizzo la classe di fastapi per gestire i dati di login (email e password)
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    #Creo una variabile che contiene il risultato della query al db per trovare l'utente con l'email fornita
    user = auth_repository.get_user_by_email(db,form_data.username)
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