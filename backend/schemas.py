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
    id: str
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
    id: str
    created_at: datetime
    user_id: str

class Config:
    from_attributes = True

class TaskBase(BaseModel):
    title: str
    status: str = "pending"

class TaskCreate(TaskBase):
    pass

class TaskUpdateStatus(BaseModel):
    status: str

class TaskOut(TaskBase):
    id: str
    procedure_id: str

    class Config:
        from_attributes = True  
class AIRequest(BaseModel):
    prompt: str

# Schema per il singolo task generato dall'IA
class AITaskStructure(BaseModel):
    title: str

# Schema completo che l'IA DOVRÀ rispettare
class AIProcedureResponse(BaseModel):
    title: str
    description: str
    tasks: list[AITaskStructure]