from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv


#Carica le variabili d'ambiente dal file .env
load_dotenv()
username = os.getenv("DB_USERNAME")
password = os.getenv("DB_PASSWORD")
db_name = os.getenv("DB_NAME")
#Host/porta configurabili: in locale il default resta 127.0.0.1:5433 (porta
#esposta da docker-compose per il solo servizio db); dentro docker-compose
#con anche backend/frontend containerizzati, DB_HOST=db e DB_PORT=5432
#(porta interna del servizio Postgres nella rete Docker).
db_host = os.getenv("DB_HOST", "127.0.0.1")
db_port = os.getenv("DB_PORT", "5433")
#Creo l'url di connessione al db
SQLALCHEMY_DATABASE_URL = f"postgresql://{username}:{password}@{db_host}:{db_port}/{db_name}"
#Provider come Neon richiedono SSL: DB_SSL=true aggiunge il parametro senza
#toccare nulla per Postgres locale/Docker, dove non serve.
if os.getenv("DB_SSL", "false").lower() == "true":
    SQLALCHEMY_DATABASE_URL += "?sslmode=require"

#Creo il motore di connessione al db
engine = create_engine(SQLALCHEMY_DATABASE_URL)

#Creo una fabbrica di sessioni (per aprire/chiudere connessioni nelle API)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#creo la classe Base. Tutti i nostri futuri modelli (tabelle) erediteranno da questa.
Base = declarative_base()

#Funzione di utilità (Dependency Injection) per ottenere una sessione del DB ad ogni richiesta HTTP
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
