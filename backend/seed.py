from sqlalchemy.orm import Session
from models.role import Role
from db.database import SessionLocal
from models.document import Document

INITIAL_DOCUMENTS = [
    {
        "title": "GDPR Requirements",
        "content": "Regolamento Generale sulla Protezione dei Dati (UE 2016/679). Requisiti chiave: Consenso esplicito, Diritto all'oblio, Anonimizzazione dei dati personali, Cifratura dei dati a riposo e in transito, Registro dei trattamenti (Art. 30), Notifica di Data Breach entro 72 ore (Art. 33).",
        "file_type": "txt"
    },
    {
        "title": "ISO 27001 Information Security Controls",
        "content": "Standard internazionale per la sicurezza delle informazioni. Controlli principali: A.9 Controllo Accessi (Logica dei privilegi minimi), A.12 Sicurezza delle Operazioni (Logging e Monitoraggio, Protezione da Malware, Backup), A.14 Acquisizione, Sviluppo e Manutenzione dei Sistemi (Crittografia, Principi di ingegneria sicura).",
        "file_type": "txt"
    },
    {
        "title": "ISO 20000 IT Service Management Requirements",
        "content": "Standard per la gestione dei servizi IT. Requisiti per il rilascio dei servizi, gestione degli incidenti, gestione dei problemi, gestione dei cambiamenti (Change Management) e monitoraggio dei livelli di servizio per garantire continuità ed efficienza.",
        "file_type": "txt"
    },
    {
        "title": "ITIL Practices and Processes",
        "content": "Framework delle best practice ITIL. Focus su Incident Management (ripristino rapido del servizio), Problem Management (identificazione della causa radice), Change Enablement (valutazione dei rischi prima di modifiche in produzione) e Deployment Management.",
        "file_type": "txt"
    },
    {
        "title": "Internal IT and Security Policies",
        "content": "Linee guida interne aziendali. Standard di complessità delle password (minimo 12 caratteri, MFA obbligatoria), rotazione delle chiavi SSH ogni 90 giorni, divieto di credenziali hardcoded nei file di configurazione o repository Git.",
        "file_type": "txt"
    },
    {
        "title": "Business Continuity and Disaster Recovery Plans",
        "content": "Piano di continuità operativa. Obiettivo RTO (Recovery Time Objective) < 4 ore. Obiettivo RPO (Recovery Point Objective) < 1 ora. Strategia: Backup incrementali giornalieri, backup completi settimanali replicati su una region AWS secondaria isolata.",
        "file_type": "txt"
    }
]


def seed_document(db: Session):
    for doc_data in INITIAL_DOCUMENTS:
        exists = db.query(Document).filter(Document.title == doc_data["title"]).first()
        if not exists:
            new_doc = Document(
                title=doc_data["title"],
                content=doc_data["content"],
                file_type=doc_data["file_type"],
            )
            db.add(new_doc)
    db.commit()


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
            
            
