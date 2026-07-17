from sqlalchemy import or_
from sqlalchemy.orm import Session
import models


# creo le funzioni per comunicare con il db, come le interfacce repository in springboot
def get_user_by_email(db:Session, user_email:str):
    return db.query(models.User).filter(models.User.email.ilike(user_email)).first()

def save_new_user(db:Session, new_user: models.User):
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

# Se page/page_size sono None restituisce tutti gli utenti (retrocompatibile per
# i consumer che hanno bisogno della lista intera: dropdown, bulk email, grafici).
# Passando page/page_size si attiva la paginazione, con ricerca opzionale su
# nome, cognome, email e ruolo.
def get_all_users(db: Session, page: int | None = None, page_size: int | None = None, search: str | None = None):
    query = db.query(models.User).outerjoin(models.Role, models.User.role_id == models.Role.id)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(
            models.User.first_name.ilike(like),
            models.User.last_name.ilike(like),
            models.User.email.ilike(like),
            models.Role.name.ilike(like),
        ))
    query = query.order_by(models.User.first_name)

    total = query.count()
    if page is not None or page_size is not None:
        effective_page = page or 1
        effective_size = page_size or 25
        items = query.offset((effective_page - 1) * effective_size).limit(effective_size).all()
    else:
        effective_page = 1
        effective_size = total
        items = query.all()

    return total, items, effective_page, effective_size


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