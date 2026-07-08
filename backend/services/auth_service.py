import hashlib
import secrets
from datetime import datetime, timedelta
from fastapi import  HTTPException, status,Response
from fastapi.security import  OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from services.audit_logger import log_action
from security.security import get_password_hash, create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
import models
import schemas
from repository import auth_repository
from models import Role
from mail_sender import send_simple_message, send_custom_email

RESET_TOKEN_EXPIRE_MINUTES = 30
# Dev: l'app gira su questa origine. In un deploy reale andrebbe letto da config/env.
FRONTEND_BASE_URL = "http://localhost:5173"


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

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
    try:
        auth_repository.save_new_user(db, new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email già registrata")
    send_simple_message(user.email,user.first_name)
    return new_user


def get_users(db: Session, page: int | None = None, page_size: int | None = None, search: str | None = None):
    return auth_repository.get_all_users(db, page, page_size, search)

def set_user_active(db: Session, user_id: str, is_active: bool):
    return auth_repository.set_user_active(db, user_id, is_active)


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
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account non attivo. Impossibile accedere."
        )
    #genero un token utilizzando la funzione importata da security, includendo l'email dell'utente come dato nel token
    access_token = create_access_token(data={"sub": user.email})
    #Salvo il token nei cookie
    response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=True,
    samesite="lax",
    max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    path="/"
    )
    log_action(
        db, user, "LOGIN", ip_address, user_agent,
        "User", user.id
    )
    db.commit()
    #ritorno il token
    return {"access_token": access_token, "token_type": "bearer"}


def forgot_password(db: Session, email: str):
    user = auth_repository.get_user_by_email(db, email)
    # Rispondiamo sempre allo stesso modo, esista o meno l'email: altrimenti
    # questo endpoint diventerebbe un modo per scoprire quali indirizzi sono registrati.
    if user:
        raw_token = secrets.token_urlsafe(32)
        user.reset_token_hash = _hash_reset_token(raw_token)
        user.reset_token_expires = datetime.now() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
        db.commit()

        reset_link = f"{FRONTEND_BASE_URL}/reset-password?token={raw_token}"
        body_html = f"""
            <h1 style="color:#367CC0;margin-top:0;font-size:22px;">Reimposta la tua password</h1>
            <p style="font-size:15px;line-height:1.6;color:#555555;">
                Abbiamo ricevuto una richiesta di reset della password per il tuo account Heximus.
                Se sei stato tu, clicca sul pulsante qui sotto per sceglierne una nuova.
                Il link è valido per {RESET_TOKEN_EXPIRE_MINUTES} minuti.
            </p>
            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin:30px auto;">
                <tr>
                    <td align="center" bgcolor="#367CC0" style="border-radius:4px;">
                        <a href="{reset_link}" target="_blank" style="font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;padding:12px 30px;display:inline-block;">Reimposta password</a>
                    </td>
                </tr>
            </table>
            <p style="font-size:13px;line-height:1.5;color:#777777;">
                Se non hai richiesto tu il reset, ignora semplicemente questa email: la tua password resta invariata.
            </p>
        """
        send_custom_email(user.email, "Reimposta la tua password - Heximus", body_html)


def reset_password(db: Session, token: str, new_password: str):
    token_hash = _hash_reset_token(token)
    user = db.query(models.User).filter(models.User.reset_token_hash == token_hash).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.now():
        raise HTTPException(status_code=400, detail="Il link è scaduto o non è più valido. Richiedine uno nuovo.")

    user.hashed_password = get_password_hash(new_password)
    # Token monouso: una volta usato (o scaduto) non deve essere piu' riutilizzabile
    user.reset_token_hash = None
    user.reset_token_expires = None
    db.commit()