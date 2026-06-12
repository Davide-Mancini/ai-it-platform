from pydantic import BaseModel

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