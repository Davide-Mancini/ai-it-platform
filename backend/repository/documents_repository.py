from uuid import UUID

from sqlalchemy.orm import Session
import models

def new_document(db:Session, document: models.Document):
    db.add(document)
    db.commit()
    db.refresh(document)
    return document

def get_by_id(db:Session, id: UUID):
    return db.query(models.Document).filter(models.Document.id== id).first()

def get_all(db: Session):
    return db.query(models.Document).all()

def get_all_for_customer(db: Session, customer_id: UUID):
    return db.query(models.Document).filter(models.Document.customer_id == customer_id).all()

def update_document(db: Session, id: UUID, data: dict):
    doc = get_by_id(db, id)
    if not doc:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(doc, key, value)
    db.commit()
    db.refresh(doc)
    return doc

def delete_document(db: Session, id: UUID):
    doc = get_by_id(db, id)
    if doc:
        db.delete(doc)
        db.commit()
    return doc