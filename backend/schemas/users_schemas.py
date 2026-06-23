from typing import Any
from uuid import UUID
from pydantic import BaseModel,EmailStr,Field,field_validator

# Schema base comune a tutti
class UserBase(BaseModel):
    email: EmailStr
    

    class Config:
        from_attributes = True # Permette a Pydantic di leggere i modelli di SQLAlchemy

# Cosa serve ricevere quando si CREA un utente (Input)
class UserCreate(UserBase):
    password: str= Field(min_length=8,max_length=25,description="La password deve contenere\n .almeno 8 caratteri\n .una lettera maiuscola\n una lettera minuscola\n un numero\n un carattere speciale ")
    
# Cosa RESTITUIAMO all'esterno (Output - Noti che non mandiamo indietro la password!)
class UserOut(UserBase):
    id: UUID
    is_active: bool
    role:str
    
    @field_validator('role', mode='before')
    @classmethod
    def extract_role_name(cls, v: Any) -> str:
        # Quando FastAPI legge l'utente dall'ORM, 'v' sarà l'intero oggetto 'Role'
      
        #has attribute verifica se l'oggetto passato ha l'attributo name, un controllo in piu
        if hasattr(v, 'name'):
            return v.name 
        return str(v)

    model_config = {"from_attributes": True}

# Schema per i dati che l'utente invia quando fa il login
class UserLogin(BaseModel):
    email: str
    password: str

# Schema per la risposta che il backend restituisce in caso di login di successo
class Token(BaseModel):
    access_token: str
    token_type: str
