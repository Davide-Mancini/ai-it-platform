from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import case, func
from sqlalchemy.orm import Session
from typing import List, Optional
from models.user import User
from models.associations import task_user_assignments as tua
from security.security import verify_access_token
import models
import schemas
from db.database import get_db
from services import auth_service
from repository import auth_repository
from services.sliding_window_limiter import IPRateLimiter
from mail_sender import send_custom_email
from models.push_subscription import PushSubscription
import os
router = APIRouter()

# Max 10 tentativi di login ogni 5 minuti, per indirizzo IP
login_rate_limit = IPRateLimiter(max_calls=10, period_seconds=300)
# Max 5 richieste di reset password ogni 15 minuti, per indirizzo IP
forgot_password_rate_limit = IPRateLimiter(max_calls=5, period_seconds=900)


# Il token viaggia in un cookie httpOnly (impostato al login), non in un header
# Authorization: cosi' non e' mai leggibile da JavaScript, anche in caso di XSS.
def get_current_user(access_token: Optional[str] = Cookie(default=None), db: Session = Depends(get_db)) -> models.User:
    if access_token is None:
        raise HTTPException(status_code=401, detail="Non autenticato")
    email = verify_access_token(access_token)
    if email is None:
        raise HTTPException(status_code=401, detail="Token non valido")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    # Un utente disattivato dall'admin non deve poter usare un cookie ancora
    # valido: senza questo controllo manterrebbe accesso fino alla scadenza
    # del token (fino a ACCESS_TOKEN_EXPIRE_MINUTES), esattamente come al login.
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account non attivo")
    return user


# Come get_current_user, ma blocca anche chi non ha ancora un ruolo assegnato
# ("Basic User": account appena registrato, in attesa di approvazione — vedi
# seed.py). Da usare come dependency su tutte le rotte che espongono dati/azioni
# di business, cosi' l'attesa di approvazione e' applicata lato server e non
# solo dal routing del frontend. Le rotte di self-service (/me, /logout, push)
# restano invece su get_current_user, cosi' un utente pending puo' comunque
# vedere il proprio stato ed effettuare logout.
def get_current_approved_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.role or current_user.role.name == "Basic User":
        raise HTTPException(status_code=403, detail="Account in attesa di approvazione da un amministratore")
    return current_user


#Creazione di un nuovo utente con controllo sull'email
@router.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return auth_service.create_user(user, db)
   

# Lista utenti — solo admin. Se page/page_size non sono passati restituisce tutto
# (retrocompatibile per i consumer che hanno bisogno della lista intera: dropdown
# assegnazione task, selezione destinatari email). Passando page/page_size si
# attiva la paginazione, con ricerca opzionale su nome/cognome/email/ruolo.
@router.get("/users/", response_model=schemas.PaginatedUsersOut)
def get_users(
    page: Optional[int] = Query(default=None, ge=1),
    page_size: Optional[int] = Query(default=None, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    total, items, effective_page, effective_size = auth_service.get_users(db, page, page_size, search)
    return schemas.PaginatedUsersOut(items=items, total=total, page=effective_page, page_size=effective_size)


# Conteggio utenti per ruolo — solo admin, per il grafico nella pagina Utenti
@router.get("/users/stats/roles", response_model=List[schemas.RoleCountOut])
def get_users_role_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    rows = (
        db.query(models.Role.name, func.count(models.User.id))
        .join(models.User, models.User.role_id == models.Role.id)
        .group_by(models.Role.name)
        .order_by(func.count(models.User.id).desc())
        .all()
    )
    return [schemas.RoleCountOut(role=role, count=count) for role, count in rows]

#funzione per il login verifica credenziali e genera token di accesso
@router.post("/login", response_model=schemas.Token)
def login(
    response: Response,
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    _rate_limit: None = Depends(login_rate_limit),
):
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return auth_service.login(db,form_data,response,ip_address=client_ip, user_agent=user_agent)

#rotta per richiedere il link di reset password via email — risponde sempre allo
#stesso modo (non rivela se l'email esiste) per non permettere di scoprire quali
#indirizzi sono registrati
@router.post("/forgot-password")
def forgot_password(
    data: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db),
    _rate_limit: None = Depends(forgot_password_rate_limit),
):
    auth_service.forgot_password(db, data.email)
    return {"message": "Se l'indirizzo è registrato, riceverai a breve un'email con le istruzioni."}

#rotta per impostare la nuova password tramite il token ricevuto via email
@router.post("/reset-password")
def reset_password(
    data: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    auth_service.reset_password(db, data.token, data.new_password)
    return {"message": "Password reimpostata con successo."}

#rotta di logout: essendo il cookie httpOnly, il frontend non puo' cancellarlo da JS
@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logout effettuato"}

#rotta che restituisce informazione sul'utente autenticato, utile nel frontend per mostrare il nome dell'utente o il suo ruolo
@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "message": f"Benvenuto {current_user.first_name} {current_user.last_name}",
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
    }

# Aggiorna il proprio profilo (nome, cognome, email)
@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    data: schemas.UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(models.User).filter(
        models.User.email == data.email,
        models.User.id != current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email già in uso da un altro utente")
    current_user.first_name = data.first_name
    current_user.last_name  = data.last_name
    current_user.email      = data.email
    db.commit()
    db.refresh(current_user)
    return current_user


# Aggiorna un utente (nome, cognome, email, ruolo) — solo admin
@router.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: str,
    data: schemas.UserUpdate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operazione non autorizzata. Solo per admin")
    user_to_modify = auth_repository.get_user_by_id(db, user_id)
    if not user_to_modify:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Utente {user_id} non trovato")
    existing = db.query(models.User).filter(models.User.email == data.email, models.User.id != user_to_modify.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email già in uso da un altro utente")
    new_role = db.query(models.Role).filter(models.Role.id == data.role_id).first()
    if not new_role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ruolo non trovato")
    if new_role.name == "Customer":
        if not data.customer_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Il ruolo Customer richiede un cliente associato")
        customer = db.query(models.Customer).filter(models.Customer.id == data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente non trovato")
        user_to_modify.customer_id = data.customer_id
    else:
        user_to_modify.customer_id = None
    user_to_modify.first_name = data.first_name
    user_to_modify.last_name  = data.last_name
    user_to_modify.email      = data.email
    user_to_modify.role_id    = data.role_id
    db.commit()
    db.refresh(user_to_modify)
    return user_to_modify

# Attiva/disattiva account utente — solo admin
@router.patch("/users/{user_id}/active", response_model=schemas.UserOut)
def set_user_active(
    user_id: str,
    data: schemas.UserActiveUpdate,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operazione non autorizzata. Solo per admin")
    user = auth_service.set_user_active(db, user_id, data.is_active)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Utente {user_id} non trovato")
    return user

# Workload per utente (task aperti/completati assegnati) — solo admin, per il grafico nella pagina Utenti
@router.get("/users/workload", response_model=List[schemas.UserWorkloadOut])
def get_users_workload(
    limit: int = Query(default=10, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_approved_user),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")

    open_count = func.sum(case((models.Task.status != "done", 1), else_=0))
    done_count = func.sum(case((models.Task.status == "done", 1), else_=0))

    rows = (
        db.query(
            models.User.id,
            models.User.first_name,
            models.User.last_name,
            open_count.label("open_tasks"),
            done_count.label("done_tasks"),
        )
        .outerjoin(tua, tua.c.user_id == models.User.id)
        .outerjoin(models.Task, models.Task.id == tua.c.task_id)
        .group_by(models.User.id, models.User.first_name, models.User.last_name)
        .order_by(open_count.desc())
        .limit(limit)
        .all()
    )

    return [
        schemas.UserWorkloadOut(
            user_id=str(row.id),
            first_name=row.first_name,
            last_name=row.last_name,
            open_tasks=int(row.open_tasks or 0),
            done_tasks=int(row.done_tasks or 0),
        )
        for row in rows
    ]


# Lista ruoli disponibili — solo admin
@router.get("/roles/", response_model=List[schemas.RoleOut])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_approved_user),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    return db.query(models.Role).all()


# Invio email a utenti specifici o a tutti — solo admin
@router.post("/send-bulk-email")
def send_bulk_email(
    data: schemas.BulkEmailRequest,
    current_user: User = Depends(get_current_approved_user),
    db: Session = Depends(get_db),
):
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operazione non autorizzata. Solo per admin")

    if data.user_ids:
        recipients = db.query(models.User).filter(models.User.id.in_(data.user_ids), models.User.is_active == True).all()
    else:
        recipients = db.query(models.User).filter(models.User.is_active == True).all()

    if not recipients:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nessun destinatario trovato")

    sent, failed = 0, 0
    for user in recipients:
        try:
            send_custom_email(user.email, data.subject, data.body_html)
            sent += 1
        except Exception:
            failed += 1

    return {"sent": sent, "failed": failed, "total": len(recipients)}


# ── Web Push ──────────────────────────────────────────────────────────────────

# Restituisce la VAPID public key al frontend.
# Il frontend ne ha bisogno PRIMA di chiamare pushManager.subscribe():
# la passa al Push Service (Google/Mozilla) come prova che appartiene al tuo server.
@router.get("/push-vapid-key")
def get_vapid_public_key(current_user: User = Depends(get_current_user)):
    key = os.getenv("VAPID_PUBLIC_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="VAPID non configurato sul server")
    return {"public_key": key}


# Salva la subscription nel DB quando l'utente attiva le notifiche push.
# Il browser chiama questo endpoint subito dopo aver ottenuto la PushSubscription
# dal Push Service. Il campo "endpoint" è unique: se l'utente si reiscrive
# con lo stesso browser, aggiorniamo invece di inserire un duplicato.
@router.post("/push-subscribe")
def push_subscribe(
    data: schemas.PushSubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == data.endpoint
    ).first()

    if existing:
        # Subscription già presente: aggiorna le chiavi (possono cambiare dopo un rinnovo)
        existing.p256dh = data.p256dh
        existing.auth   = data.auth
    else:
        db.add(PushSubscription(
            user_id  = current_user.id,
            endpoint = data.endpoint,
            p256dh   = data.p256dh,
            auth     = data.auth,
        ))

    db.commit()
    return {"status": "subscribed"}


# Elimina la subscription quando l'utente disattiva le notifiche push.
# Identifichiamo la subscription dall'endpoint, che è univoco per browser.
@router.delete("/push-unsubscribe")
def push_unsubscribe(
    data: schemas.PushSubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(PushSubscription).filter(
        PushSubscription.endpoint == data.endpoint,
        PushSubscription.user_id  == current_user.id,
    ).delete()
    db.commit()
    return {"status": "unsubscribed"}