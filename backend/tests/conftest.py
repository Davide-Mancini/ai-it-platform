"""
Fixture condivise da tutti i test. Vedi tests/README.md per la spiegazione
di cosa fa ognuna di queste e perché.
"""
import os
import sys

import pytest

# Il resto del backend fa "import models", "from db.database import ..." ecc.
# (import assoluti, non relativi al package): funzionano solo se backend/ è
# in sys.path, esattamente come quando l'app gira con "uvicorn main:app"
# lanciato da dentro backend/. pytest.ini aggiunge già "." a pythonpath
# quando si lancia pytest da backend/, questo è solo un fallback.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv  # noqa: E402

load_dotenv(os.path.join(BACKEND_DIR, ".env"))

# I test girano SEMPRE su un database Postgres separato da quello di sviluppo
# (stesso server, nome diverso), così non si rischia mai di sporcare o
# svuotare dati veri. Il database va creato una volta sola a mano, vedi
# tests/README.md. Sovrascriviamo DB_NAME dopo il load_dotenv sopra, quindi
# vince sempre questo valore anche se nel .env c'è scritto altro.
os.environ["DB_NAME"] = os.environ.get("TEST_DB_NAME", "it_platform_test")

# Alcuni moduli leggono queste variabili al momento dell'IMPORT (non quando
# vengono effettivamente usate) e vanno in errore se mancano. Non servono
# per far girare i test, quindi mettiamo un valore finto SOLO se manca
# davvero (setdefault non sovrascrive un valore già presente nel .env).
os.environ.setdefault("JWT_SECRET", "test-secret-key")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import event  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import models  # noqa: E402,F401  serve per registrare tutte le tabelle su Base.metadata
from db.database import Base, engine, get_db  # noqa: E402
from api.endpoints.api import api_router  # noqa: E402
from models.customer import Customer  # noqa: E402
from models.role import Role  # noqa: E402
from models.user import User  # noqa: E402
from security.security import get_password_hash  # noqa: E402

# Password usata di default da user_factory: tenerla in una costante evita
# refusi quando serve richiamarla altrove (es. nella fixture login).
DEFAULT_PASSWORD = "Password123!"


@pytest.fixture(scope="session", autouse=True)
def _test_schema():
    """Crea tutte le tabelle sul DB di test all'avvio della sessione pytest e le elimina alla fine."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """
    Una sessione SQLAlchemy isolata per ogni singolo test.

    Il codice dei service (es. auth_service, task_service) chiama db.commit()
    normalmente. Per poter comunque annullare TUTTO alla fine del test,
    apriamo una transazione + una SAVEPOINT: ogni commit() interno chiude
    solo la savepoint, che viene subito riaperta dall'evento sotto. La
    transazione esterna non viene mai confermata davvero, quindi il
    rollback finale cancella ogni traccia del test dal database.
    """
    connection = engine.connect()
    outer_transaction = connection.begin()
    session = Session(bind=connection)
    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, transaction):
        if transaction.nested and not transaction._parent.nested:
            sess.begin_nested()

    yield session

    session.close()
    outer_transaction.rollback()
    connection.close()


@pytest.fixture(autouse=True)
def _no_outbound_email(monkeypatch):
    """I test non devono MAI inviare email vere: le funzioni di invio diventano no-op."""
    monkeypatch.setattr("services.auth_service.send_simple_message", lambda *a, **k: None)
    monkeypatch.setattr("services.auth_service.send_custom_email", lambda *a, **k: None)


@pytest.fixture(autouse=True)
def _reset_rate_limiters():
    """
    login_rate_limit e forgot_password_rate_limit (api/endpoints/auth.py) sono
    istanze create UNA SOLA VOLTA quando il modulo auth viene importato, e
    contano i tentativi per indirizzo IP. Nei test l'IP è sempre lo stesso
    ("testclient", quello finto usato da TestClient): senza reset, dopo 10
    login in tutta la sessione di pytest i test successivi che fanno login
    inizierebbero a fallire con 429, indipendentemente da cosa testano.
    """
    from api.endpoints.auth import forgot_password_rate_limit, login_rate_limit

    login_rate_limit._calls.clear()
    forgot_password_rate_limit._calls.clear()


@pytest.fixture()
def client(db_session):
    """
    TestClient su un'app FastAPI "vera" (stessi router di main.py) ma senza
    passare da main.py: main.py, all'import, si connette al DB e lancia
    delle ALTER TABLE di migrazione, cosa che nei test non vogliamo. Qui
    montiamo solo l'api_router e sostituiamo get_db con la sessione
    transazionale di db_session.
    """
    app = FastAPI()
    app.include_router(api_router, prefix="/api")

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    # base_url "https://": il login imposta il cookie con secure=True (vedi
    # auth_service.login). Un client su base_url "http://" (il default)
    # riceverebbe il cookie ma non lo rimanderebbe indietro nelle richieste
    # successive, perché i cookie "secure" viaggiano solo su origini https.
    with TestClient(app, base_url="https://testserver") as test_client:
        yield test_client


@pytest.fixture()
def role_factory(db_session):
    """Restituisce una funzione per ottenere (creandolo se serve) un ruolo per nome."""
    def _make_role(name="Engineer"):
        role = db_session.query(Role).filter(Role.name == name).first()
        if role is None:
            role = Role(name=name, description=name)
            db_session.add(role)
            db_session.commit()
        return role
    return _make_role


@pytest.fixture()
def user_factory(db_session, role_factory):
    """Restituisce una funzione per creare rapidamente un utente con password già hashata."""
    def _make_user(email="mario.rossi@example.com", password=DEFAULT_PASSWORD, role_name="Engineer", **kwargs):
        role = role_factory(role_name)
        user = User(
            email=email,
            first_name=kwargs.get("first_name", "Mario"),
            last_name=kwargs.get("last_name", "Rossi"),
            hashed_password=get_password_hash(password),
            role_id=role.id,
            is_active=kwargs.get("is_active", True),
            customer_id=kwargs.get("customer_id"),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    return _make_user


@pytest.fixture()
def customer_factory(db_session):
    """Restituisce una funzione per creare rapidamente un cliente (Customer aziendale, non l'utente)."""
    def _make_customer(name="Cliente Test", vat_number="IT12345678901", **kwargs):
        customer = Customer(name=name, vat_number=vat_number, email=kwargs.get("email"))
        db_session.add(customer)
        db_session.commit()
        db_session.refresh(customer)
        return customer
    return _make_customer


@pytest.fixture()
def login(client):
    """
    Restituisce una funzione che logga sul client un utente già esistente
    (creato con user_factory) e lascia il cookie di sessione sul client per
    le richieste successive. Utile quando un test ha bisogno di più utenti
    con ruoli diversi (es. un Admin e poi un Customer nello stesso test).
    """
    def _login(user, password=DEFAULT_PASSWORD):
        response = client.post(
            "/api/auth/login",
            data={"username": user.email, "password": password},
        )
        assert response.status_code == 200, response.text
        return client
    return _login


@pytest.fixture()
def auth_client(client, user_factory, login):
    """Un TestClient già loggato come Engineer generico: le richieste successive portano il cookie access_token."""
    user = user_factory(email="loggato@example.com", role_name="Engineer")
    login(user)
    return client, user
