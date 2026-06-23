from fastapi import  HTTPException, status,Response
from fastapi.security import  OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from services.audit_logger import log_action
from security.security import get_password_hash, create_access_token, verify_password
import models
import schemas
from repository import auth_repository
from models import Role


def create_user(user: schemas.UserCreate, db: Session):
    #Qui creo una variabile che contiene il risultato del controllo sulla email
    db_user = auth_repository.get_user_by_email(db,user.email)
    #Se l'email e gia presente lancio un'ecceizione
    if db_user:
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    default_role= db.query(Role).filter(Role.name=='Engineer').first()
    if not default_role:
        raise HTTPException(status_code=500, detail="Configurazione di sistema incompleta")
    #cripto la password utilizzando la funzione importatata da security
    hashed_password = get_password_hash(user.password)
    #creo un nuovo oggetto con i dati forniti
    new_user = models.User(
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        hashed_password=hashed_password,
        role_id= default_role.id
    )
    auth_repository.save_new_user(db, new_user)
    return new_user


def get_users(db: Session):
    return auth_repository.get_all_users(db)


def login(
    #Utilizzo la classe di fastapi per gestire i dati di login (email e password)
    db: Session,
    form_data: OAuth2PasswordRequestForm,
    response: Response,
    ip_address: str,
    user_agent: str
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
    #Salvo il token nei cookie
    response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=True,
    samesite="lax"
    )
    log_action(
        db, user, "LOGIN", ip_address, user_agent,
        "User", user.id
    )
    db.commit()
    #ritorno il token
    return {"access_token": access_token, "token_type": "bearer"}