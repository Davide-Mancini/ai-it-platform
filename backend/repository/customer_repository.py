from sqlalchemy.orm import Session
import models

def save_new_customer(db:Session, customer:models.Customer):
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
def get_customer_by_id(db:Session, id:str):
    return db.query(models.Customer).filter(models.Customer.id==id).first()

def find_customer_by_name(db:Session, name:str):
    return db.query(models.Customer).filter(models.Customer.name==name).first()

def delete_customer(db:Session, customer: models.Customer):
    db.delete(customer)
    db.commit()