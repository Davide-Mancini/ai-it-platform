from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from api.endpoints.auth import get_current_user
from services.audit_logger import log_action
import models
import schemas
from repository import customer_repository

def create_new_customer(
    db: Session,
    ip_address: str,
    user_agent: str,
    customer_in: schemas.CustomerCreate,
    current_user: models.User = None) -> models.Customer:
    existing_customer = customer_repository.find_customer_by_name(db,customer_in.name)
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Operazione annullata: il cliente '{customer_in.name}' è già registrato a sistema."
        )

    new_customer = models.Customer(
        name=customer_in.name,
        vat_number=customer_in.vat_number,
        email=customer_in.email,
        notes=customer_in.notes
    )

    try:
        customer_repository.save_new_customer(db,new_customer)
        log_action(
            db, current_user, "NEW CUSTOMER", ip_address, user_agent,
             "Customer"
        )
        db.commit()
        return new_customer
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore imprevisto durante il salvataggio del cliente: {str(e)}"
        )
        
        
def update_customer(
    id: str,
    ip_address: str,
    user_agent: str,
    customer_data: schemas.CustomerUpdate,
    db: Session,
    current_user: models.User
):
    db_customer = customer_repository.get_customer_by_id(db, id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer non trovato")
    db_customer.name = customer_data.name
    db_customer.email = customer_data.email
    db_customer.is_active = customer_data.is_active
    db_customer.vat_number = customer_data.vat_number
    db_customer.notes = customer_data.notes
    log_action(
            db, current_user, "CUSTOMER UPDATED", ip_address, user_agent,
             "Customer"
        )
    db.commit()
    db.refresh(db_customer)
    return db_customer


def patch_customer(
    id: str,
    ip_address: str,
    user_agent: str,
    customer_data: schemas.CustomerUpdate,
    db: Session,
    current_user: models.User = Depends(get_current_user)
):
    db_customer = customer_repository.get_customer_by_id(db, id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer non trovato")
    update_fields = customer_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(db_customer, field, value)
        
    log_action(
            db, current_user, "CUSTOMER UPDATED", ip_address, user_agent,
             "Customer", db_customer.id
        )
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(
    id:str,
    ip_address: str,
    user_agent: str,
    db:Session,
    current_user: models.User = Depends(get_current_user)
):
    db_customer= customer_repository.get_customer_by_id(db,id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer non trovato")
    customer_repository.delete_customer(db,db_customer)
    log_action(
            db, current_user, "CUSTOMER DELETED", ip_address, user_agent,
             "Customer", db_customer.id
        )
    db.commit()
    