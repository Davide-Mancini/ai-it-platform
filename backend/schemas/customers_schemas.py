from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CustomerBase(BaseModel):
    name: str = Field(..., max_length=150, description="Nome azienda o cliente")
    vat_number: Optional[str]= Field(None, max_length=50, description="Partita IVA o codice VAT azienda")
    email:Optional[str]= Field(max_length=50,description="Email di contatto del cliente o azienda")
    notes:Optional[str]= Field(None, description="Note interne")
    
class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    vat_number: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    
class CustomerOut(CustomerBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True