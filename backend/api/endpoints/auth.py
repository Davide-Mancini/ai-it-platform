from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from models.user import User
from security.security import verify_access_token
import models
import schemas
from db.database import get_db
from services import auth_service
from repository import auth_repository
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
   

# Lista utenti — solo admin
@router.get("/users/", response_model=List[schemas.UserOut])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    return auth_service.get_users(db)

#funzione per il login verifica credenziali e genera token di accesso
@router.post("/login", response_model=schemas.Token)
def login(response: Response,request: Request,form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return auth_service.login(db,form_data,response,ip_address=client_ip, user_agent=user_agent)

#rotta che restituisce informazione sul'utente autenticato, utile nel frontend per mostrare il nome dell'utente o il suo ruolo
@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "message": f"Benvenuto {current_user.first_name} {current_user.last_name}",
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
    }

# Aggiorna il proprio profilo (nome, cognome, email)
@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    data: schemas.UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(models.User).filter(
        models.User.email == data.email,
        models.User.id != current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email già in uso da un altro utente")
    current_user.first_name = data.first_name
    current_user.last_name  = data.last_name
    current_user.email      = data.email
    db.commit()
    db.refresh(current_user)
    return current_user


# Aggiorna un utente (nome, cognome, email, ruolo) — solo admin
@router.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: str,
    data: schemas.UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operazione non autorizzata. Solo per admin")
    user_to_modify = auth_repository.get_user_by_id(db, user_id)
    if not user_to_modify:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Utente {user_id} non trovato")
    existing = db.query(models.User).filter(models.User.email == data.email, models.User.id != user_to_modify.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email già in uso da un altro utente")
    user_to_modify.first_name = data.first_name
    user_to_modify.last_name  = data.last_name
    user_to_modify.email      = data.email
    user_to_modify.role_id    = data.role_id
    db.commit()
    db.refresh(user_to_modify)
    return user_to_modify

# Attiva/disattiva account utente — solo admin
@router.patch("/users/{user_id}/active", response_model=schemas.UserOut)
def set_user_active(
    user_id: str,
    data: schemas.UserActiveUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operazione non autorizzata. Solo per admin")
    user = auth_service.set_user_active(db, user_id, data.is_active)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Utente {user_id} non trovato")
    return user

# Lista ruoli disponibili — solo admin
@router.get("/roles/", response_model=List[schemas.RoleOut])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    return db.query(models.Role).all()