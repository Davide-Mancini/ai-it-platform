from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user
from services import procedure_version_service
from schemas.procedure_version_schemas import ProcedureVersionPut

router = APIRouter()

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: models.User = Depends(get_current_user)):
        user_role_name = current_user.role.name if hasattr(current_user.role, 'name') else current_user.role
        if user_role_name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi necessari per gestire le versioni delle procedure."
            )
        return current_user

allow_it_staff = RoleChecker(["Admin", "IT_MANAGER"])


@router.post("/{procedure_id}/versions", response_model=schemas.ProcedureVersionPut, status_code=status.HTTP_201_CREATED)
def create_procedure_version(
    procedure_id: str,
    version_in: schemas.ProcedureVersionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_it_staff)
):
    
    return procedure_version_service.create_version_with_steps(
        db=db, 
        procedure_id=procedure_id, 
        version_in=version_in, 
        user_id=current_user.id
    )