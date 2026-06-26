from sqlalchemy.orm import Session
import models


# creo le funzioni per comunicare con il db, come le interfacce repository in springboot
def get_user_by_email(db:Session, user_email:str):
    return db.query(models.User).filter(models.User.email == user_email).first()

def save_new_user(db:Session, new_user: models.User):
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
def get_all_users(db:Session):
    return db.query(models.User).all()
   
def get_user_by_id(db:Session, user_id:str):
    return db.query(models.User).filter(models.User.id==user_id).first()

def set_user_active(db: Session, user_id: str, is_active: bool):
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user