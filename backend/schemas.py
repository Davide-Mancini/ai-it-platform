from pydantic import BaseModel
from datetime import datetime

# Schema base comune a tutti
class UserBase(BaseModel):
    email: str
    role: str = "Engineer"

    class Config:
        from_attributes = True # Permette a Pydantic di leggere i modelli di SQLAlchemy

# Cosa serve ricevere quando si CREA un utente (Input)
class UserCreate(UserBase):
    password: str

# Cosa RESTITUIAMO all'esterno (Output - Noti che non mandiamo indietro la password!)
class UserOut(UserBase):
    id: int
    is_active: bool

# Schema per i dati che l'utente invia quando fa il login
class UserLogin(BaseModel):
    email: str
    password: str

# Schema per la risposta che il backend restituisce in caso di login di successo
class Token(BaseModel):
    access_token: str
    token_type: str

class ProcedureBase(BaseModel):
    title: str
    description: str|None = None

class ProcedureCreate(ProcedureBase):
    pass

class ProcedureOut(ProcedureBase):
    id: int
    created_at: datetime
    user_id: int

class Config:
    from_attributes = True
