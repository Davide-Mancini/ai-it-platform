import asyncio
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import models
import schemas
from db.database import get_db
from api.endpoints.auth import get_current_user
from security.security import verify_access_token
from services import notification_service
from services.sse_manager import sse_manager

router = APIRouter()


@router.get("/stream")
async def notifications_stream(
    request: Request,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """SSE endpoint — il client si connette qui e riceve le notifiche in tempo reale."""
    email = verify_access_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Token non valido")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    queue = await sse_manager.subscribe(str(user.id))

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(data)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            sse_manager.unsubscribe(str(user.id), queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/", response_model=List[schemas.NotificationOut])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return notification_service.get_notifications(db, current_user.id)


@router.patch("/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    n = notification_service.mark_as_read(db, notification_id, current_user.id)
    if not n:
        raise HTTPException(status_code=404, detail="Notifica non trovata")
    return n


@router.patch("/read-all", status_code=204)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notification_service.mark_all_as_read(db, current_user.id)
