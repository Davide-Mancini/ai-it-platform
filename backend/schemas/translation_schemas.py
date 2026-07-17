from typing import List
from pydantic import BaseModel


class IndexedTranslation(BaseModel):
    index: int
    title: str
    description: str


class BatchProcedureTranslationResponse(BaseModel):
    items: List[IndexedTranslation]


class StepTranslationBatchResponse(BaseModel):
    steps: List[IndexedTranslation]
