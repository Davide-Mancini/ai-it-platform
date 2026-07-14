import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from api.endpoints.api import api_router
from db.database import engine,Base,SessionLocal
from seed import seed_role, seed_document, seed_policies,seed_knowledge_base
from services import procedure_review_service
from sqlalchemy import text

Base.metadata.create_all(bind=engine)

# Migrate: add missing columns if they don't exist yet
with engine.connect() as _conn:
    _conn.execute(text(
        "ALTER TABLE procedure_steps ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'todo'"
    ))
    _conn.execute(text(
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'low'"
    ))
    _conn.execute(text(
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
    ))
    _conn.execute(text(
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE"
    ))
    _conn.execute(text(
        "ALTER TABLE procedures ADD COLUMN IF NOT EXISTS language VARCHAR(5) NOT NULL DEFAULT 'it'"
    ))
    _conn.execute(text(
        "ALTER TABLE ai_recommendations ADD COLUMN IF NOT EXISTS language VARCHAR(5) NOT NULL DEFAULT 'it'"
    ))
    _conn.execute(text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL"
    ))
    _conn.execute(text(
        "ALTER TABLE ai_recommendations ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL"
    ))
    _conn.execute(text(
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_customer_input BOOLEAN NOT NULL DEFAULT false"
    ))
    _conn.execute(text(
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_fields JSON"
    ))
    _conn.execute(text(
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS customer_response_data JSON"
    ))
    _conn.execute(text(
        "ALTER TABLE tasks DROP COLUMN IF EXISTS customer_response"
    ))
    _conn.execute(text(
        "ALTER TABLE documents ALTER COLUMN content DROP NOT NULL"
    ))
    _conn.execute(text(
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE CASCADE"
    ))
    _conn.execute(text(
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL"
    ))
    _conn.execute(text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR"
    ))
    _conn.execute(text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP"
    ))
    _conn.execute(text(
        "ALTER TABLE procedure_review_findings ALTER COLUMN summary TYPE TEXT"
    ))
    # Le colonne created_at/updated_at qui sotto erano state salvate come TIMESTAMP
    # naive (ora locale del server) invece che UTC-aware: questo causava attivita'
    # mostrate con un orario sfasato rispetto a quello reale (es. "3 ore fa" appena
    # eseguite). Riconvertite a TIMESTAMPTZ interpretando i valori esistenti come UTC.
    for _table, _column in [
        ("audit_logs", "created_at"),
        ("ai_recommendations", "created_at"),
        ("customers", "created_at"),
        ("customers", "updated_at"),
        ("documents", "created_at"),
        ("documents", "updated_at"),
        ("policies", "created_at"),
        ("policies", "updated_at"),
    ]:
        _conn.execute(text(
            f"ALTER TABLE {_table} ALTER COLUMN {_column} TYPE TIMESTAMP WITH TIME ZONE "
            f"USING {_column} AT TIME ZONE 'UTC'"
        ))
    _conn.commit()
app = FastAPI(title="AI Assisted IT Platform API")

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    # Regex invece di una lista fissa di origin: copre sia localhost sia
    # qualunque IP della rete locale (es. http://192.168.1.x:5173), cosi'
    # il frontend e' raggiungibile anche da altri dispositivi sulla stessa WiFi.
    allow_origin_regex=r"http://(localhost|(\d{1,3}\.){3}\d{1,3}):(5173|3000|5174)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
db = SessionLocal()
try:
    seed_role(db)
    seed_document(db)
    seed_policies(db)
    seed_knowledge_base(db)
finally:
    db.close()



UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Includiamo tutte le rotte del progetto con un unico comando
app.include_router(api_router, prefix="/api")


def _run_scheduled_procedure_review():
    db = SessionLocal()
    try:
        procedure_review_service.run_review(db, triggered_by="scheduler")
    finally:
        db.close()


scheduler = BackgroundScheduler()
# Revisione automatica delle procedure ogni notte alle 03:00
scheduler.add_job(_run_scheduled_procedure_review, CronTrigger(hour=3, minute=0), id="procedure_review_nightly")
scheduler.start()


@app.on_event("shutdown")
def _shutdown_scheduler():
    scheduler.shutdown(wait=False)