from fastapi import APIRouter, Depends, HTTPException,status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user
from services import customer_service

router = APIRouter()

#endpoint creazione nuovo cliente
@router.post('/', response_model=schemas.CustomerOut)
def new_customer(
    customer: schemas.CustomerCreate,
    db:Session= Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return customer_service.create_new_customer(db,customer)

#endpoint per update cliente (sostituzione completa)
@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(
    customer_id: str,
    customer: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return customer_service.update_customer(customer_id, customer, db)

#endpoint per aggiornamento parziale cliente
@router.patch("/{customer_id}", response_model=schemas.CustomerOut)
def patch_customer(
    customer_id: str,
    customer: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return customer_service.patch_customer(customer_id, customer, db)

@router.delete('/{customer_id}',status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    id:str,
    db:Session= Depends(get_db)
):
    customer_service.delete_customer(id,db)