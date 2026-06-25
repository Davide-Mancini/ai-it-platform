from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints.api import api_router
from db.database import engine,Base,SessionLocal
from seed import seed_role, seed_document, seed_policies,seed_knowledge_base
from sqlalchemy import text

Base.metadata.create_all(bind=engine)

# Migrate: add status column to procedure_steps if it doesn't exist yet
with engine.connect() as _conn:
    _conn.execute(text(
        "ALTER TABLE procedure_steps ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'todo'"
    ))
    _conn.commit()
app = FastAPI(title="AI Assisted IT Platform API")

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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



# Includiamo tutte le rotte del progetto con un unico comando
app.include_router(api_router, prefix="/api")