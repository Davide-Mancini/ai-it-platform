import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.endpoints.api import api_router
from db.database import engine,Base,SessionLocal
from seed import seed_role, seed_document, seed_policies,seed_knowledge_base
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
    _conn.commit()
app = FastAPI(title="AI Assisted IT Platform API")

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
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