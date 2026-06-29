from fastapi import APIRouter
from api.endpoints import auth, procedures, tasks_endpoint, ai, customer_endpoints, procedure_version, audit_log,documents,policy_endpoint,knowledgeBI_endpoint, notifications_endpoint, team_endpoint
#Assegno alla variabile api_router un istanza dell'oggeto APIRoute()
api_router = APIRouter()

#Raccoolgo tutti i router dei vari endpoint (rest cotnroller in Java) includendoli in api_router
#Questo file verra poi importato in main per essere incluso in app di FastAPI
api_router.include_router(ai.router, prefix="/ai", tags=["AI Generation"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(procedures.router, prefix="/procedures", tags=["Procedures"])
api_router.include_router(tasks_endpoint.router,prefix="/tasks", tags=["Tasks"])
api_router.include_router(customer_endpoints.router, prefix="/customers", tags=["Customers"])
api_router.include_router(procedure_version.router, prefix="/procedure-version",tags=["Procedure_Version"])
api_router.include_router(audit_log.router, prefix="/audit",tags=["Audit"])
api_router.include_router(documents.router, prefix='/documents', tags=['Documents'])
api_router.include_router(policy_endpoint.router, prefix='/policy', tags=['Policy'])
api_router.include_router(knowledgeBI_endpoint.router, prefix='/knowledge-base-item',tags=['Knowledge Base Item'])
api_router.include_router(notifications_endpoint.router, prefix='/notifications', tags=['Notifications'])
api_router.include_router(team_endpoint.router, prefix='/team', tags=['Team'])