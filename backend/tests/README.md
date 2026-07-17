# Guida a pytest per questo progetto

Guida pratica per iniziare a scrivere test per il backend, con esempi già
funzionanti nella cartella `tests/`. Non presuppone esperienza pregressa con
pytest.

## 1. Concetti base di pytest

- **Un test è una funzione che inizia con `test_`**, dentro un file che
  inizia con `test_`. Nessuna classe o boilerplate richiesto.
- **`assert`** è l'unica cosa che serve per far fallire un test: se
  l'espressione dopo `assert` è falsa, pytest segna il test come fallito e
  mostra automaticamente i valori coinvolti (non serve scrivere messaggi
  d'errore a mano).
- Una **fixture** è una funzione decorata con `@pytest.fixture` che prepara
  qualcosa che serve al test (es. una connessione al DB, un utente finto) e
  lo passa al test come parametro, con lo stesso nome della fixture. pytest
  la richiama automaticamente quando vede un parametro con quel nome.
- **`conftest.py`** è un file speciale: le fixture definite lì sono
  visibili automaticamente in tutti i file di test della stessa cartella
  (e sottocartelle), senza bisogno di import.

Esempio minimo (vedi [`test_security.py`](test_security.py) per il caso reale):

```python
def test_somma():
    assert 1 + 1 == 2
```

## 2. Prerequisiti per questo progetto

Il codice del backend usa `sqlalchemy.dialects.postgresql.UUID` come tipo
per tutte le chiavi primarie (vedi es. [`models/user.py`](../models/user.py)),
quindi **i test non possono girare su SQLite in-memory** come si vede spesso
nei tutorial: serve un vero Postgres. Usiamo lo stesso Postgres del
`docker-compose.yml` del progetto, ma un **database separato** da quello di
sviluppo, così i test non toccano mai dati veri.

1. Installa le dipendenze di test (nel venv del backend):
   ```bash
   pip install -r requirements-dev.txt
   ```
2. Crea una volta sola il database di test (il container Postgres del
   progetto deve essere già in esecuzione, `docker compose up -d db`):
   ```bash
   docker exec it_platform_db psql -U <DB_USERNAME> -d <DB_NAME> -c "CREATE DATABASE it_platform_test"
   ```
   (`<DB_USERNAME>`/`<DB_NAME>` sono quelli del tuo `backend/.env`.)
   Se preferisci un nome diverso, impostalo con la variabile d'ambiente
   `TEST_DB_NAME` prima di lanciare pytest.

Tutto il resto (URL di connessione, utente, password) viene letto dallo
stesso `backend/.env` che usa già l'app: `tests/conftest.py` lo carica e
sovrascrive solo `DB_NAME` con quello di test.

## 3. Lanciare i test

Da dentro `backend/`:

```bash
pytest                          # tutti i test
pytest -v                       # output verboso, un risultato per test
pytest tests/test_security.py   # solo un file
pytest -k "login"               # solo i test il cui nome contiene "login"
pytest --cov=. --cov-report=term-missing   # con coverage (richiede pytest-cov)
```

`pytest.ini` nella root del backend è già configurato (`pythonpath = .`),
quindi non serve nessun altro settaggio per far funzionare gli `import
models`, `from db.database import ...` ecc. usati ovunque nel codice.

## 4. Come sono organizzati i test di questo progetto

Tre livelli, dal più veloce/isolato al più realistico:

| Livello | Cosa tocca | Esempio | Quando usarlo |
|---|---|---|---|
| **Unitario puro** | Solo la funzione, niente DB/HTTP | [`test_security.py`](test_security.py), [`test_sliding_window_limiter.py`](test_sliding_window_limiter.py) | Logica pura: hashing, JWT, rate limiter, calcoli |
| **Service** | Funzioni in `services/*.py` con un DB vero (di test) | [`test_task_service.py`](test_task_service.py) | Regole di business: chi può fare cosa, validazioni |
| **Integrazione (API)** | Router + service + repository + DB, via `TestClient` | [`test_auth_api.py`](test_auth_api.py), [`test_procedures_api.py`](test_procedures_api.py) | Comportamento end-to-end di un endpoint: status code, cookie, corpo della risposta |

### Le fixture in `conftest.py`

- **`db_session`**: una sessione SQLAlchemy avvolta in una transazione che
  viene **sempre annullata (rollback)** alla fine del test, anche se il
  codice testato chiama `db.commit()` (cosa che quasi tutti i service del
  progetto fanno). Il trucco è una SAVEPOINT che si riapre da sola —
  spiegato nel commento della fixture. Risultato pratico: ogni test parte
  da un database pulito, senza dover cancellare nulla a mano e senza che i
  test si sporchino a vicenda.
- **`client`**: un `TestClient` di FastAPI, con `get_db` sostituito dalla
  `db_session` del test corrente. **Non importa `main.py`**: quel file, al
  solo import, si connette al DB reale ed esegue delle `ALTER TABLE` di
  migrazione pensate per Postgres, cosa che nei test non serve e
  complicherebbe solo le cose. Monta invece direttamente `api_router`
  (stessi endpoint, stesso comportamento).
- **`role_factory` / `user_factory` / `customer_factory`**: scorciatoie per
  creare rapidamente ruoli, utenti (con password già hashata) e clienti, da
  riusare in ogni test che ha bisogno di questi dati.
- **`login`**: funzione che logga sul `client` un utente creato con
  `user_factory` (fa un vero `POST /api/auth/login`; il cookie resta sul
  client per le richieste successive, come farebbe un browser). Utile
  quando un test deve alternare più utenti/ruoli diversi nella stessa
  chiamata di test (es. un Engineer crea una risorsa, poi un Customer prova
  ad accedervi).
- **`auth_client`**: come `client` + `login`, ma già pronto con un Engineer
  generico — comodo quando il ruolo esatto non conta ai fini del test.
- **`_no_outbound_email`** (automatica su ogni test): sostituisce le
  funzioni di invio email reali con dei no-op, così nessun test manda mai
  email vere, indipendentemente da cosa c'è nel `.env`.
- **`_reset_rate_limiters`** (automatica su ogni test): vedi il riquadro
  sotto, è la fixture che ci ha impedito test "flaky" per un motivo non
  ovvio.

Nota tecnica su `auth_client`/`client`: il cookie di login viene impostato
con `secure=True` (vedi [`services/auth_service.py`](../services/auth_service.py)),
quindi il `TestClient` deve avere un `base_url` in `https://`, altrimenti il
browser-finto di test non rispedirebbe il cookie nelle richieste successive.
È già gestito in `conftest.py`; utile saperlo se in futuro si crea un altro
client di test da zero.

### Un bug reale scoperto scrivendo questi test: stato condiviso tra test

`login_rate_limit` in [`api/endpoints/auth.py`](../api/endpoints/auth.py) è
un oggetto creato **una sola volta**, quando il modulo viene importato (non
ad ogni richiesta), e tiene un contatore di tentativi per indirizzo IP. Nei
test l'IP è sempre lo stesso (`"testclient"`, quello finto di `TestClient`).
Risultato: senza intervenire, dopo 10 login fatti in tutta la sessione di
pytest (contando tutti i file di test insieme, non solo uno), i test
successivi che fanno login avrebbero iniziato a fallire con `429 Too Many
Requests` — non perché il codice testato fosse sbagliato, ma perché i test
si "avvelenavano" a vicenda condividendo uno stato globale in memoria.

La fixture `_reset_rate_limiters` risolve svuotando i contatori prima di
ogni test. È un esempio concreto di una regola generale: **ogni oggetto
creato a livello di modulo (fuori da una funzione) e che mantiene uno stato
interno è un candidato a "inquinare" i test** — va isolato o resettato tra
un test e l'altro, altrimenti l'ordine in cui i test girano inizia a
contare (e non dovrebbe mai contare).

## 5. Pattern da seguire per i prossimi test

Struttura consigliata per ogni test (**Arrange / Act / Assert**):

```python
def test_qualcosa(client, user_factory):
    # Arrange: prepara i dati
    user_factory(email="x@example.com", role_name="Admin")

    # Act: esegui l'azione da testare
    response = client.get("/api/auth/roles/")

    # Assert: verifica il risultato
    assert response.status_code == 401  # niente cookie di login
```

Checklist quando aggiungi un test per un nuovo endpoint o una nuova
funzione di service:

- [ ] Un test per il **caso felice** (dati validi, utente autorizzato).
- [ ] Un test per ogni **regola di autorizzazione** (es. "solo Admin",
      "non un Customer") — sono la parte più delicata di questo progetto,
      guarda `if current_user.role.name != "Admin": raise HTTPException(403, ...)`
      sparsi per gli endpoint.
- [ ] Un test per il **caso non trovato** (id inesistente → 404).
- [ ] Un test per l'**input non valido**, se c'è validazione oltre a Pydantic.
- Nomi descrittivi: `test_<cosa>_<condizione>_<risultato_atteso>`, es.
  `test_login_with_wrong_password_returns_401`.
- Se la funzione da testare non ha bisogno di HTTP (es. un'altra funzione in
  `services/`), preferisci il livello "service" (come `test_task_service.py`)
  invece di passare da `TestClient`: è più veloce e più mirato.

## 6. Cosa NON è ancora coperto (spunti per continuare)

- Endpoint che usano `services/gemini_service.py` (generazione AI): vanno
  testati facendo il *mock* del client Gemini (`monkeypatch` su
  `services.gemini_service.ai_client`), per non fare vere chiamate a
  Google durante i test.
- `services/push_service.py` (notifiche push): stessa storia, va mockato
  `pywebpush.webpush`.
- Test sui repository (`repository/*.py`) se in futuro contengono query
  complesse che vale la pena isolare dal service.
