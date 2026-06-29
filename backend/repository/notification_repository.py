from sqlalchemy.orm import Session
from uuid import UUID
import models


def create_notification(db: Session, user_id: UUID, title: str, message: str, type: str) -> models.Notification:
    n = models.Notification(user_id=user_id, title=title, message=message, type=type)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def get_notifications_for_user(db: Session, user_id: UUID):
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user_id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )


def mark_as_read(db: Session, notification_id: UUID, user_id: UUID) -> models.Notification | None:
    n = (
        db.query(models.Notification)
        .filter(models.Notification.id == notification_id, models.Notification.user_id == user_id)
        .first()
    )
    if n:
        n.is_read = True
        db.commit()
        db.refresh(n)
    return n


def mark_all_as_read(db: Session, user_id: UUID):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
