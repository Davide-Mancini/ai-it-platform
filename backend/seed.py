from sqlalchemy.orm import Session
from models.role import Role
from db.database import SessionLocal
from models.document import Document
from models.policy import Policy
from models.knowledge_base_item import KnowledgeBaseItem

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
    },
    {
    "title": "Service Level Agreements",
    "content": "Accordi sui livelli di servizio (SLA). Definizione di uptime minimo garantito del 99.9%. Tempo massimo di risposta per ticket critici: < 1 ora. Penali previste in caso di mancato rispetto degli standard. Monitoraggio continuo delle performance tramite strumenti automatizzati.",
    "file_type": "txt"
    },
    {
    "title": "Customer Contracts",
    "content": "Contratti con i clienti che definiscono termini e condizioni del servizio. Inclusione di clausole su responsabilità, protezione dei dati (GDPR), livelli di servizio e condizioni di recesso. Specifica dei diritti e obblighi di entrambe le parti e delle modalità di gestione delle controversie.",
    "file_type": "txt"
    },
    {
    "title": "Risk Management Documentation",
    "content": "Documentazione di gestione del rischio. Identificazione, valutazione e mitigazione dei rischi IT e operativi. Utilizzo di una matrice rischio-impatto. Implementazione di controlli basati su ISO 27001. Revisione periodica dei rischi e aggiornamento delle strategie di mitigazione.",
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
            
            
POLICIES_TO_SEED = [
    {
        "category": "POL-SEC-01",
        "title": "Controllo Accessi e Autenticazione Forte",
        "description": "È obbligatorio l'uso dell'autenticazione a due fattori (MFA) per tutti gli account aziendali e l'accesso ai server di produzione. Le password devono avere una lunghezza minima di 12 caratteri.",
        "document_title": "ISO 27001 Information Security Controls"
    },
    {
        "category": "POL-DAT-01",
        "title": "Trattamento e Anonimizzazione dei Dati Personali",
        "description": "Tutti i dati sensibili degli utenti (PII) memorizzati nei database di staging e test devono essere anonimizzati o mascherati. In produzione, i dati devono essere cifrati a riposo.",
        "document_title": "GDPR Requirements"
    },
    {
        "category": "POL-BAC-01",
        "title": "Strategia di Backup e Conservazione",
        "description": "I backup dei database critici devono essere eseguiti ogni 24 ore con retention di 30 giorni. Almeno una copia settimanale deve essere replicata in una region cloud isolata.",
        "document_title": "Business Continuity and Disaster Recovery Plans"
    },
    {
        "category": "POL-ITS-01",
        "title": "Gestione dei Cambiamenti in Produzione (Change Management)",
        "description": "Qualsiasi modifica all'infrastruttura di produzione deve essere documentata tramite un ticket di Change Request e approvata dal responsabile del team prima del rilascio.",
        "document_title": "ISO 20000 IT Service Management Requirements"
    }
]

def seed_policies(db: Session):
    """Funzione per popolare automaticamente le policy aziendali legandole ai documenti"""
    print("Controllo seeding delle policy interne...")
    
    for policy_data in POLICIES_TO_SEED:
        #Controlla se la policy esiste già (evita duplicati)
        existing_policy = db.query(Policy).filter(Policy.category == policy_data["category"]).first()
        
        if not existing_policy:
            #Cerca il documento corrispondente nel DB per recuperare il suo UUID
            linked_doc = db.query(Document).filter(Document.title == policy_data["document_title"]).first()
            
            document_id = linked_doc.id if linked_doc else None
            if not document_id:
                print(f"Attenzione: Non ho trovato il documento '{policy_data['document_title']}' per la policy {policy_data['category']}. Verrà creata senza collegamento.")

            #Crea e inserisce la policy
            new_policy = Policy(
                category=policy_data["category"],
                title=policy_data["title"],
                description=policy_data["description"],
                document_id=document_id,
                is_active=True
            )
            db.add(new_policy)
            print(f"Policy creata con successo: {policy_data['category']} -> Collegata a: {policy_data['document_title']}")
        else:
            print(f"Policy {policy_data['category']} già presente. Salto l'inserimento.")
            
    db.commit()
    

KB_ITEMS_TO_SEED = [
    {
        "title": "Comando di Backup Automatico PostgreSQL (pg_dump)",
        "category": "Database",
        "tags": ["postgres", "backup", "bash"],
        "content": (
            "Per eseguire un backup sicuro di un database PostgreSQL in produzione, utilizzare il comando pg_dump "
            "con compressione attiva. Esempio di script Bash da inserire in un cronjob giornaliero:\n\n"
            "```bash\n"
            "#!/bin/bash\n"
            "TIMESTAMP=$(date +%Y%m%d_%H%M%S)\n"
            "BACKUP_DIR=\"/var/backups/postgres\"\n"
            "DB_NAME=\"prod_db\"\n"
            "export PGPASSWORD=\"stringa_password_sicura\"\n\n"
            "pg_dump -h localhost -U db_user -F c -b -v -f \"$BACKUP_DIR/$DB_NAME_$TIMESTAMP.backup\" $DB_NAME\n"
            "```\n"
            "Nota: Assicurarsi che la cartella di destinazione abbia i permessi ristretti (chmod 700)."
        )
    },
    {
        "title": "Script SQL per Anonimizzazione/Mascheramento Dati Personali (PII)",
        "category": "Database",
        "tags": ["postgres", "sql", "gdpr", "compliance"],
        "content": (
            "Prima di importare il dump di produzione negli ambienti di staging o test, è obbligatorio "
            "offuscare i dati sensibili (nomi, cognomi ed email) per la conformità GDPR. Esempio di query di mascheramento:\n\n"
            "```sql\n"
            "UPDATE users \n"
            "SET \n"
            "    first_name = 'User_' || id,\n"
            "    last_name = 'Anon_' || id,\n"
            "    email = 'anon_' || id || '@aziendatest.local',\n"
            "    password_hash = '$2b$12$DummyHashForTestingPurposesOnly';\n"
            "```"
        )
    },
    {
        "title": "Configurazione Docker Daemon per Sicurezza e Logging",
        "category": "DevOps",
        "tags": ["docker", "security", "json"],
        "content": (
            "Per limitare la dimensione dei log ed evitare il riempimento del disco sui server di produzione, "
            "configurare il file `/etc/docker/daemon.json` forzando la rotazione dei log prima del deploy:\n\n"
            "```json\n"
            "{\n"
            "  \"log-driver\": \"json-file\",\n"
            "  \"log-opts\": {\n"
            "    \"max-size\": \"10m\",\n"
            "    \"max-file\": \"3\"\n"
            "  },\n"
            "  \"userns-remap\": \"default\"\n"
            "}\n"
            "```\n"
            "Dopo la modifica, riavviare il servizio con: `sudo systemctl restart docker`."
        )
    },
    {
        "title": "Generazione e Hardening Chiavi SSH per Accesso Server",
        "category": "Security",
        "tags": ["ssh", "linux", "security"],
        "content": (
            "Standard aziendale per la generazione delle chiavi SSH destinate agli amministratori di sistema. "
            "Non è consentito l'uso di algoritmi obsoleti (come RSA senza una lunghezza adeguata). Utilizzare Ed25519:\n\n"
            "```bash\n"
            "# Generazione sul PC locale\n"
            "ssh-keygen -t ed25519 -C \"nome.cognome@azienda.com\"\n\n"
            "# Configurazione consigliata nel file /etc/ssh/sshd_config del server:\n"
            "PasswordAuthentication no\n"
            "PubkeyAuthentication yes\n"
            "PermitRootLogin no\n"
            "```"
        )
    },
    
{
"title": "Riavvio sicuro servizio Nginx in produzione",
"category": "DevOps",
"tags": ["nginx", "restart", "linux"],
"content": "Per riavviare Nginx senza downtime utilizzare il comando reload invece di restart:\n\n```bash\nsudo systemctl reload nginx\n```\nQuesto comando ricarica la configurazione senza interrompere le connessioni attive.\nVerificare prima la configurazione con:\n```bash\nsudo nginx -t\n```"
},
{
"title": "Pulizia cache Redis",
"category": "Backend",
"tags": ["redis", "cache", "performance"],
"content": "Per svuotare completamente la cache Redis utilizzare:\n\n```bash\nredis-cli FLUSHALL\n```\nPer ambienti di produzione è preferibile utilizzare FLUSHDB per limitare l'impatto:\n```bash\nredis-cli FLUSHDB\n```"
},
{
"title": "Monitoraggio log Docker container",
"category": "DevOps",
"tags": ["docker", "logs", "debug"],
"content": "Per visualizzare i log in tempo reale di un container Docker:\n\n```bash\ndocker logs -f nome_container\n```\nPer limitare le righe:\n```bash\ndocker logs --tail 100 nome_container\n```"
},
{
"title": "Connessione SSH con chiave privata",
"category": "Security",
"tags": ["ssh", "authentication", "linux"],
"content": "Per connettersi a un server tramite chiave SSH:\n\n```bash\nssh -i ~/.ssh/id_rsa user@host\n```\nAssicurarsi che la chiave abbia permessi corretti:\n```bash\nchmod 600 ~/.ssh/id_rsa\n```"
},
{
"title": "Creazione virtual environment Python",
"category": "Backend",
"tags": ["python", "venv", "setup"],
"content": "Per creare e attivare un virtual environment:\n\n```bash\npython3 -m venv venv\nsource venv/bin/activate\n```\nPer disattivarlo:\n```bash\ndeactivate\n```"
},
{
"title": "Installazione dipendenze Node.js",
"category": "Frontend",
"tags": ["node", "npm", "dependencies"],
"content": "Per installare le dipendenze di un progetto Node.js:\n\n```bash\nnpm install\n```\nPer installare una dipendenza specifica:\n```bash\nnpm install nome-pacchetto\n```"
},
{
"title": "Verifica porte in ascolto su Linux",
"category": "System",
"tags": ["network", "ports", "linux"],
"content": "Per verificare le porte in ascolto:\n\n```bash\nsudo netstat -tulnp\n```\nOppure con ss:\n```bash\nss -tulnp\n```"
},
{
"title": "Kill processo su porta specifica",
"category": "System",
"tags": ["process", "kill", "linux"],
"content": "Per terminare un processo su una porta:\n\n```bash\nlsof -i :3000\nkill -9 PID\n```"
},
{
"title": "Build applicazione React",
"category": "Frontend",
"tags": ["react", "build", "deploy"],
"content": "Per creare una build ottimizzata:\n\n```bash\nnpm run build\n```\nI file verranno generati nella cartella /build pronti per il deploy."
},
{
"title": "Verifica stato servizio systemd",
"category": "DevOps",
"tags": ["systemctl", "service", "linux"],
"content": "Per controllare lo stato di un servizio:\n\n```bash\nsystemctl status nome-servizio\n```\nPer avviarlo:\n```bash\nsystemctl start nome-servizio\n```"
},
{
"title": "Connessione a database MySQL",
"category": "Database",
"tags": ["mysql", "connection"],
"content": "Per connettersi a MySQL:\n\n```bash\nmysql -u user -p -h host db_name\n```\nInserire la password quando richiesto."
},
{
"title": "Backup database MySQL",
"category": "Database",
"tags": ["mysql", "backup"],
"content": "Per eseguire un backup:\n\n```bash\nmysqldump -u user -p db_name > backup.sql\n```"
},
{
"title": "Aggiornamento pacchetti Ubuntu",
"category": "System",
"tags": ["ubuntu", "update"],
"content": "Per aggiornare il sistema:\n\n```bash\nsudo apt update && sudo apt upgrade -y\n```"
},
{
"title": "Test endpoint API con curl",
"category": "Backend",
"tags": ["api", "curl"],
"content": "Per testare un endpoint:\n\n```bash\ncurl -X GET https://api.example.com\n```\nPer POST:\n```bash\ncurl -X POST -H \"Content-Type: application/json\" -d '{\"key\":\"value\"}' URL\n```"
},
{
"title": "Configurazione variabili ambiente",
"category": "DevOps",
"tags": ["env", "configuration"],
"content": "Per impostare variabili ambiente:\n\n```bash\nexport NODE_ENV=production\n```\nPer renderle permanenti aggiungerle a ~/.bashrc"
},
{
"title": "Verifica utilizzo CPU e RAM",
"category": "Monitoring",
"tags": ["performance", "linux"],
"content": "Per monitorare risorse:\n\n```bash\ntop\n```\nOppure:\n```bash\nhtop\n```"
},
{
"title": "Clonare repository Git",
"category": "DevOps",
"tags": ["git", "repository"],
"content": "Per clonare un repo:\n\n```bash\ngit clone https://github.com/user/repo.git\n```"
},
{
"title": "Creazione branch Git",
"category": "DevOps",
"tags": ["git", "branch"],
"content": "Per creare un nuovo branch:\n\n```bash\ngit checkout -b feature/nome-branch\n```"
},
{
"title": "Merge branch Git",
"category": "DevOps",
"tags": ["git", "merge"],
"content": "Per unire un branch:\n\n```bash\ngit checkout main\ngit merge feature/nome-branch\n```"
},
{
"title": "Rollback deploy applicazione",
"category": "DevOps",
"tags": ["deploy", "rollback"],
"content": "Per eseguire rollback usando Docker:\n\n```bash\ndocker-compose down\ndocker-compose up -d versione_precedente\n```\nOppure tramite sistema CI/CD selezionando build precedente."
}
,

{
"title": "Gestione ticket con informazioni incomplete",
"category": "Support",
"tags": ["ticket", "triage", "support"],
"content": "Quando un ticket contiene informazioni insufficienti, l'operatore deve prima richiedere dettagli aggiuntivi all'utente. Informazioni chiave includono: ambiente (produzione/test), dispositivo, orario del problema e passi per riprodurlo. Il ticket non deve essere assegnato finché non sono presenti dati minimi sufficienti."
},
{
"title": "Classificazione priorità incidenti IT",
"category": "Incident Management",
"tags": ["priority", "incident"],
"content": "La priorità di un incidente deve essere determinata in base a impatto e urgenza. Problemi che bloccano l'intero sistema o più utenti devono essere classificati come critici. Problemi isolati o con workaround disponibili devono avere priorità inferiore."
},
{
"title": "Gestione incidenti critici",
"category": "Incident Management",
"tags": ["incident", "critical"],
"content": "In caso di incidente critico, è necessario attivare immediatamente il team responsabile, notificare gli stakeholder e aggiornare regolarmente lo stato del ticket. Deve essere mantenuto un log dettagliato delle azioni intraprese."
},
{
"title": "Procedura di escalation supporto",
"category": "Support",
"tags": ["escalation", "support"],
"content": "Se un ticket non viene risolto entro il tempo previsto o richiede competenze avanzate, deve essere escalato al livello successivo. L'escalation deve includere tutte le informazioni raccolte e le azioni già tentate."
},
{
"title": "Gestione ticket duplicati",
"category": "Support",
"tags": ["duplicate", "ticket"],
"content": "Quando vengono identificati ticket duplicati, devono essere collegati al ticket principale. Il ticket principale deve essere aggiornato con tutte le informazioni rilevanti, mentre i duplicati possono essere chiusi con riferimento."
},
{
"title": "Analisi causa radice (Root Cause Analysis)",
"category": "Problem Management",
"tags": ["rca", "analysis"],
"content": "Dopo la risoluzione di un incidente significativo, è necessario condurre un'analisi della causa radice per identificare l'origine del problema e prevenire futuri incidenti simili."
},
{
"title": "Comunicazione con l'utente finale",
"category": "Support",
"tags": ["communication", "user"],
"content": "Durante la gestione di un ticket, è importante mantenere una comunicazione chiara e regolare con l'utente. Gli aggiornamenti devono essere comprensibili anche per utenti non tecnici."
},
{
"title": "Validazione della soluzione",
"category": "Support",
"tags": ["validation", "solution"],
"content": "Prima di chiudere un ticket, la soluzione deve essere verificata e confermata. Se possibile, l'utente finale deve confermare che il problema è stato risolto."
},
{
"title": "Documentazione delle soluzioni",
"category": "Knowledge Base",
"tags": ["documentation", "kb"],
"content": "Ogni soluzione efficace deve essere documentata nella knowledge base, includendo descrizione del problema, causa e soluzione. Questo facilita la risoluzione futura."
},
{
"title": "Gestione richieste di accesso",
"category": "Security",
"tags": ["access", "security"],
"content": "Le richieste di accesso devono essere approvate secondo le policy aziendali. È necessario verificare l'identità dell'utente e assicurarsi che abbia i permessi necessari prima di concedere accesso."
},
{
"title": "Gestione reset password",
"category": "Support",
"tags": ["password", "security"],
"content": "Le richieste di reset password devono seguire procedure sicure, inclusa la verifica dell'identità dell'utente. Non devono mai essere condivise password in chiaro."
},
{
"title": "Monitoraggio continuo sistemi",
"category": "Monitoring",
"tags": ["monitoring", "system"],
"content": "I sistemi critici devono essere monitorati continuamente per rilevare anomalie. Gli alert devono essere configurati per notificare tempestivamente eventuali problemi."
},
{
"title": "Gestione cambiamenti (Change Management)",
"category": "Change Management",
"tags": ["change", "process"],
"content": "Ogni modifica ai sistemi deve essere documentata, approvata e testata prima del rilascio in produzione. I cambiamenti devono essere tracciabili."
},
{
"title": "Testing prima del deploy",
"category": "DevOps",
"tags": ["testing", "deploy"],
"content": "Prima di ogni deploy, devono essere eseguiti test automatici e manuali per garantire la stabilità del sistema. I deploy non testati possono introdurre regressioni."
},
{
"title": "Gestione ambienti (dev, staging, produzione)",
"category": "DevOps",
"tags": ["environment", "deploy"],
"content": "È fondamentale mantenere separati gli ambienti di sviluppo, staging e produzione. Le modifiche devono essere testate in staging prima di essere rilasciate in produzione."
},
{
"title": "Gestione incidenti ricorrenti",
"category": "Problem Management",
"tags": ["incident", "recurring"],
"content": "Incidenti che si verificano frequentemente devono essere analizzati come problemi strutturali e non trattati come casi isolati."
},
{
"title": "Gestione SLA",
"category": "Service Management",
"tags": ["sla", "service"],
"content": "Ogni ticket deve rispettare gli SLA definiti. È importante monitorare i tempi di risposta e risoluzione per garantire la qualità del servizio."
},
{
"title": "Chiusura ticket",
"category": "Support",
"tags": ["closure", "ticket"],
"content": "Un ticket può essere chiuso solo dopo che il problema è stato risolto e documentato. Deve includere una descrizione chiara della soluzione adottata."
},
{
"title": "Gestione errori in produzione",
"category": "Incident Management",
"tags": ["production", "error"],
"content": "Gli errori in produzione devono essere trattati con alta priorità. È necessario ridurre al minimo l'impatto sugli utenti e ripristinare il servizio il prima possibile."
},
{
"title": "Uso della knowledge base",
"category": "Knowledge Base",
"tags": ["kb", "support"],
"content": "Prima di creare un nuovo ticket o avviare un'analisi, è buona pratica consultare la knowledge base per verificare se esistono soluzioni già documentate."
}
]


def seed_knowledge_base(db: Session):

    for item_data in KB_ITEMS_TO_SEED:
        # Verifichiamo se esiste già un articolo con lo stesso titolo per evitare duplicati
        exists = db.query(KnowledgeBaseItem).filter(KnowledgeBaseItem.title == item_data["title"]).first()
        
        if not exists:
            new_item = KnowledgeBaseItem(
                title=item_data["title"],
                category=item_data["category"],
                tags=item_data["tags"],
                content=item_data["content"]
            )
            db.add(new_item)
            print(f"KB Item creato: [{item_data['category']}] {item_data['title']}")
        else:
            print(f"KB Item già presente: '{item_data['title']}'. Salto.")
            
    db.commit()