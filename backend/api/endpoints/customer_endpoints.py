from typing import List
from fastapi import APIRouter, Depends, Request,status
from sqlalchemy.orm import Session
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_approved_user
from services import customer_service
from services.gemini_service import allow_it_creators

router = APIRouter()

#endpoint elenco clienti
@router.get('/', response_model=List[schemas.CustomerOut])
def list_customers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user)
):
    return customer_service.list_customers(db)

#endpoint creazione nuovo cliente — riservato ad Admin/IT Manager, come le altre
#operazioni che toccano dati di business (stesso RoleChecker usato per le procedure)
@router.post('/', response_model=schemas.CustomerOut)
def new_customer(
    customer: schemas.CustomerCreate,
    request: Request,
    db:Session= Depends(get_db),
    current_user: models.User = Depends(allow_it_creators)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return customer_service.create_new_customer(db,ip_address,user_agent,customer,current_user)

#endpoint per update cliente (sostituzione completa)
@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(
    customer_id: str,
    customer: schemas.CustomerUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_creators)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return customer_service.update_customer(customer_id,ip_address,user_agent, customer, db,current_user)

#endpoint per aggiornamento parziale cliente
@router.patch("/{customer_id}", response_model=schemas.CustomerOut)
def patch_customer(
    customer_id: str,
    request: Request,
    customer: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_creators)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return customer_service.patch_customer(customer_id,ip_address, user_agent, customer, db,current_user)

@router.delete('/{customer_id}',status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id:str,
    request: Request,
    db:Session= Depends(get_db),
    current_user: models.User = Depends(allow_it_creators)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    customer_service.delete_customer(customer_id,ip_address,user_agent,db,current_user)