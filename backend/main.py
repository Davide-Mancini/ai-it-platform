from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints.api import api_router 
from db.database import engine,Base,SessionLocal
from seed import seed_role, seed_document, seed_policies,seed_knowledge_base

Base.metadata.create_all(bind=engine)
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