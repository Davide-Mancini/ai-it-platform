from sqlalchemy.orm import Session
import models

def save_new_procedure(db:Session, procedure:models.Procedure):
    db.add(procedure)
    db.commit()
    db.refresh(procedure)
    
    
def get_procedure_by_id(id:str,db:Session):
    return db.query(models.Procedure).filter(models.Procedure.id == id).first()


def delete_procedure_by_id(db:Session,procedure:models.Procedure):
    db.delete(procedure)
    db.commit()