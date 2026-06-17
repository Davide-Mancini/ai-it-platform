from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import models
import schemas

def create_version_with_steps(
    db: Session, 
    procedure_id: str, 
    version_in: schemas.ProcedureVersionCreate, 
    user_id: str
) -> models.ProcedureVersion:
   
    procedure_exists = db.query(models.Procedure).filter(models.Procedure.id == procedure_id).first()
    if not procedure_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Impossibile creare la versione: Procedura con ID {procedure_id} non trovata."
        )

    try:
    
        db_version = models.ProcedureVersion(
            procedure_id=procedure_id,
            version_number=version_in.version_number,
            status=version_in.status,
            change_description=version_in.change_description,
            created_by_id=user_id
        )
        db.add(db_version)
        db.flush()

    
        for step_data in version_in.steps:
            db_step = models.ProcedureStep(
                version_id=db_version.id,
                step_number=step_data.step_number,
                title=step_data.title,
                description=step_data.description,
                estimated_duration=step_data.estimated_duration
            )
            db.add(db_step)


        db.commit()
        db.refresh(db_version)
        return db_version

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore durante il salvataggio della versione e dei relativi passaggi: {str(e)}"
        )