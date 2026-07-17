from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from .customers_schemas import CustomerOut

class ProcedureBase(BaseModel):
    title: str
    description: str|None = None

class ProcedureCreate(ProcedureBase):
    language: str = "it"
    customer_id: Optional[UUID] = None

class ProcedureOut(ProcedureBase):
    id: UUID
    created_at: datetime
    user_id: UUID
    language: str = "it"
    customer_id: Optional[UUID] = None
    customer: Optional[CustomerOut] = None

    class Config:
        from_attributes = True

# Risposta paginata per l'elenco procedure (usata dalla tabella/griglia con ricerca;
# se page/page_size non sono passati, l'endpoint restituisce tutto in una sola "pagina")
class PaginatedProceduresOut(BaseModel):
    items: List[ProcedureOut]
    total: int
    page: int
    page_size: int

# Conteggio procedure per lingua, per il grafico in Analytics
class LanguageCountOut(BaseModel):
    language: str
    count: int

# Conteggio procedure create per giorno, per il grafico trend in Analytics
class DateCountOut(BaseModel):
    date: str
    count: int
