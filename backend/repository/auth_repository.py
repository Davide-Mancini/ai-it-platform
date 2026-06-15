from sqlalchemy.orm import Session
import models

def get_user_by_email(db:Session, user_email:str):
    return db.query(models.User).filter(models.User.email == user_email).first()

def save_new_user(db:Session, new_user: models.User):
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
def get_all_users(db:Session):
    return db.query(models.User).all()
   
    