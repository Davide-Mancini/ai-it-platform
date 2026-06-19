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