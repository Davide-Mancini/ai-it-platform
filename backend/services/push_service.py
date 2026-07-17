import os
import json
from uuid import UUID

from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session

from models.push_subscription import PushSubscription


def _get_vapid_private_key() -> str:
    """
    Restituisce la VAPID private key in formato base64url grezzo (43 caratteri).
    pywebpush 2.x vuole il valore scalare della chiave EC P-256, non il PEM intero.
    """
    return os.getenv("VAPID_PRIVATE_KEY", "")


def send_push_to_user(db: Session, user_id: UUID, title: str, message: str, notification_id: str = "") -> None:
    """
    Invia una Web Push notification a tutti i browser registrati dall'utente.

    Il flusso per ogni subscription salvata nel DB:
      1. pywebpush cifra il payload con le chiavi p256dh/auth del browser
      2. Firma la richiesta con la VAPID private key
      3. Fa POST all'endpoint del Push Service (Google/Mozilla)
      4. Il Push Service recapita il messaggio al browser
      5. Il Service Worker (sw.js) riceve l'evento "push" e chiama showNotification()

    Se il Push Service risponde 404 o 410 significa che quella subscription
    non esiste più (l'utente ha revocato il permesso dal browser o ha
    cancellato i dati). In quel caso la eliminiamo dal DB.
    """
    private_key = _get_vapid_private_key()
    claims_email = os.getenv("VAPID_CLAIMS_EMAIL", "mailto:admin@example.com")

    if not private_key:
        print("[push_service] VAPID_PRIVATE_KEY non configurata, push non inviata")
        return

    subscriptions = db.query(PushSubscription).filter(
        PushSubscription.user_id == user_id
    ).all()

    if not subscriptions:
        return

    payload = json.dumps({"title": title, "message": message, "id": notification_id})
    to_delete = []

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth":   sub.auth,
                    },
                },
                data=payload,
                vapid_private_key=private_key,
                vapid_claims={"sub": claims_email},
            )
        except WebPushException as e:
            status = e.response.status_code if e.response is not None else None

            if status in (404, 410):
                # 404 = endpoint non trovato, 410 = subscription scaduta/revocata
                # In entrambi i casi la subscription non è più valida: la puliamo.
                to_delete.append(sub.id)
            else:
                print(f"[push_service] Errore push (status {status}): {e}")
        except Exception as e:
            print(f"[push_service] Errore inatteso: {e}")

    if to_delete:
        db.query(PushSubscription).filter(
            PushSubscription.id.in_(to_delete)
        ).delete(synchronize_session=False)
        db.commit()
