from sqlalchemy.orm import Session
import models
import schemas

def save_new_task(db=Session, task=models.Task):
    db.add(task)
    db.commit()
    db.refresh(task)
    

def get_task_by_id(db=Session, id=str):
    return db.query(models.Task).filter(models.Task.id==id).first()

def update_task_status(db=Session, task=models.Task, status_update=schemas.TaskUpdateStatus):
    task.status = status_update.status
    db.commit()
    db.refresh(task)

def update_task_priority(db: Session, task: models.Task, priority: str):
    task.priority = priority
    db.commit()
    db.refresh(task)
    