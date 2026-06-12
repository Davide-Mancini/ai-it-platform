from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 1. Definiamo la stringa di connessione (URL del Database)
# Formato: postgresql://utente:password@host:porta/nome_db
SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL = "postgresql://admin:supersecretpassword@127.0.0.1:5433/it_platform"

# 2. Creiamo l'engine (il motore che gestisce i flussi di dati con il DB)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. Creiamo una fabbrica di sessioni (ci servirà per aprire/chiudere connessioni nelle API)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Creiamo la classe Base. Tutti i nostri futuri modelli (tabelle) erediteranno da questa.
Base = declarative_base()

# 5. Funzione di utilità (Dependency Injection) per ottenere una sessione del DB ad ogni richiesta HTTP
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()