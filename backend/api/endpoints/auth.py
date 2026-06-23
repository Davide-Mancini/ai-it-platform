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

#rotta per modificare ruolo solo se admin
@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    new_role_id: str,
    current_user: User= Depends(get_current_user),
    db:Session=Depends(get_db)
):
    if current_user.role.name != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operazione non autorizzata. Solo per admin"
        )
        
    user_to_modify= auth_repository.get_user_by_id(db, user_id)
    if not user_to_modify:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail=f"Utente con id {user_id} non trovato")
    user_to_modify.role_id=new_role_id
    db.commit()
    return{'message': "Ruolo aggiornato"}