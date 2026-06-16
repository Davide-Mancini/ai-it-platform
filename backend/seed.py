from sqlalchemy.orm import Session
from models.role import Role

#Questa funzione popola il db con i ruoli se non esistono gia
def seed_role(db:Session):
    default_roles=[
        {"name": "Admin", "description":"Total access"},
        {"name": "Engineer", "description":"Executes technical tasks and validates tehnical data"},
        {"name": "IT Manager","description": "Approves proceudres,assigns respnsability,review reports"},
        {"name": "Sales","description":"Communicates with customers and collects required information"},
        {"name": "Auditor","description":"Reviews auditntrails, evidence and compilance links"},
        {"name": "Customer","description":"Provides required data or confirms requested information"},
        {"name": "AI Assistant","description":"Generates procedure drafts, recommends steps and suggest document links"}
    ]
    
    for role in default_roles:
        exists= db.query(Role).filter(Role.name==role["name"]).first()
        if not exists:
            new_role = Role(name=role["name"],description=role["description"])
            db.add(new_role)
            db.commit()