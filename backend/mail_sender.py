import os
import requests

def send_simple_message(email, first_name):
    api_key = os.getenv("MAILGUN_API_KEY")
    domain = os.getenv("MAILGUN_DOMAIN", "sandbox348aae73e87f47aeb00f9f8252e1fdce.mailgun.org")

    if not api_key:
        print("[mail_sender] MAILGUN_API_KEY non configurata, mail non inviata")
        return

    response = requests.post(
        f"https://api.mailgun.net/v3/{domain}/messages",
        auth=("api", api_key),
        data={
            "from": f"Heximus AI Platform <postmaster@{domain}>",
            "to": email,
            "subject": f"Benvenuto su Heximus AI Platform, {first_name}!",
            "html": f"""
            <h1 style="color:#0C6EFD;">Benvenuto {first_name}!</h1>
            <p>Grazie per esserti registrato su Heximus AI Platform.</p>
            <p><b>Account creato con successo.</b></p>
            """
            
        },
    )

    if not response.ok:
        print(f"[mail_sender] Errore Mailgun: {response.status_code} - {response.text}")
