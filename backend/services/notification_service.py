from uuid import UUID
from sqlalchemy.orm import Session
from repository import notification_repository
from services.sse_manager import sse_manager
from services.push_service import send_push_to_user


def create_notification(db: Session, user_id: UUID, title: str, message: str, type: str = "system"):
    n = notification_repository.create_notification(db, user_id, title, message, type)

    # Canale 1 — SSE: aggiorna il campanellino in-app in tempo reale (tab aperta)
    sse_manager.notify(
        str(user_id),
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        },
    )

    # Canale 2 — Web Push: notifica nativa del browser (anche a tab chiusa)
    send_push_to_user(db, user_id, n.title, n.message, str(n.id))

    return n


def get_notifications(db: Session, user_id: UUID):
    return notification_repository.get_notifications_for_user(db, user_id)


def mark_as_read(db: Session, notification_id: UUID, user_id: UUID):
    return notification_repository.mark_as_read(db, notification_id, user_id)


def mark_all_as_read(db: Session, user_id: UUID):
    notification_repository.mark_all_as_read(db, user_id)


def delete_notification(db: Session, notification_id: UUID, user_id: UUID) -> bool:
    return notification_repository.delete_notification(db, notification_id, user_id)


def delete_all_notifications(db: Session, user_id: UUID):
    notification_repository.delete_all_notifications(db, user_id)
