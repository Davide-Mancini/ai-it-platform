from fastapi import APIRouter
from services import gemini_service
from api.endpoints import auth, procedures, tasks_endpoint

api_router = APIRouter()

api_router.include_router(gemini_service.router, prefix="/ai", tags=["AI Generation"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(procedures.router, prefix="/procedures", tags=["Procedures"])
api_router.include_router(tasks_endpoint.router, tags=["Tasks"])
