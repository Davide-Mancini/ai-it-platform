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
        timeout=10,
        data={
            "from": f"Heximus AI Platform <postmaster@{domain}>",
            "to": email,
            "subject": f"Benvenuto su Heximus AI Platform, {first_name}!",
           "html": f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Benvenuto su Heximus</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f8f9fa; color: #333333;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                
                <tr>
                    <td bgcolor="#367CC0" style="padding: 30px 20px; text-align: center;">
                        <img src="https://res.cloudinary.com/dyl6viqkf/image/upload/v1782799821/Heximus_Logo_AI_Platform_nhsevf.png" alt="Heximus AI Platform" width="160" style="display: block; margin: 0 auto; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.15));"/>
                    </td>
                </tr>

                <tr>
                    <td style="padding: 40px 30px;">
                        <h1 style="color: #367CC0; margin-top: 0; font-size: 24px; font-weight: 600;">Benvenuto a bordo, {first_name}!</h1>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #555555;">
                            Grazie per esserti registrato su <b>Heximus AI Platform</b>. La nostra missione è semplificare e automatizzare la gestione delle tue procedure IT attraverso la potenza dell'Intelligenza Artificiale.
                        </p>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #555555;">
                            Il tuo account è stato creato con successo ed è pronto all'uso. Da oggi potrai ottimizzare i tuoi flussi operativi, creare documentazione tecnica assistita e monitorare l'esecuzione dei processi in tempo reale.
                        </p>

                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f7fe; border-left: 4px solid #367CC0; margin: 25px 0; padding: 15px 20px; border-radius: 0 6px 6px 0;">
                            <tr>
                                <td>
                                    <h3 style="margin: 0 0 10px 0; color: #367CC0; font-size: 16px;">Primi Passi su Heximus:</h3>
                                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5; color: #444444;">
                                        <li>Esplora la Dashboard principale</li>
                                        <li>Crea la tua prima procedura IT guidata dall'IA</li>
                                        <li>Consulta la documentazione integrata</li>
                                    </ul>
                                </td>
                            </tr>
                        </table>

                        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                            <tr>
                                <td align="center" bgcolor="#367CC0" style="border-radius: 4px;">
                                    <a href="http://localhost:5173" target="_blank" style="font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 12px 30px; display: inline-block;">Accedi alla Piattaforma</a>
                                </td>
                            </tr>
                        </table>

                        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;"/>

                        <p style="font-size: 14px; line-height: 1.5; color: #777777; margin-bottom: 0;">
                            Se riscontri difficoltà o hai domande sul funzionamento della piattaforma, rispondi direttamente a questa email: il nostro team di supporto ti ricontatterà al più presto.
                        </p>
                    </td>
                </tr>

                <tr>
                    <td bgcolor="#f8f9fa" style="padding: 20px 30px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0 0 5px 0;">&copy; 2026 Heximus AI Platform. Tutti i diritti riservati.</p>
                        <p style="margin: 0;">Ricevi questa email perché ti sei registrato su heximus-ai-platform.</p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """ 
        },
    )

    if not response.ok:
        print(f"[mail_sender] Errore Mailgun: {response.status_code} - {response.text}")


def send_custom_email(email: str, subject: str, body_html: str):
    api_key = os.getenv("MAILGUN_API_KEY")
    domain = os.getenv("MAILGUN_DOMAIN", "sandbox348aae73e87f47aeb00f9f8252e1fdce.mailgun.org")

    if not api_key:
        print("[mail_sender] MAILGUN_API_KEY non configurata, mail non inviata")
        return

    wrapped_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;background-color:#f8f9fa;color:#333333;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
         style="max-width:600px;background-color:#ffffff;margin:20px auto;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
    <tr>
      <td bgcolor="#367CC0" style="padding:20px;text-align:center;">
        <img src="https://res.cloudinary.com/dyl6viqkf/image/upload/v1782799821/Heximus_Logo_AI_Platform_nhsevf.png"
             alt="Heximus AI Platform" width="140" style="display:block;margin:0 auto;" />
      </td>
    </tr>
    <tr>
      <td style="padding:35px 30px;">
        {body_html}
      </td>
    </tr>
    <tr>
      <td bgcolor="#f8f9fa" style="padding:20px 30px;text-align:center;font-size:12px;color:#999999;border-top:1px solid #eeeeee;">
        <p style="margin:0 0 4px 0;">&copy; 2026 Heximus AI Platform. Tutti i diritti riservati.</p>
      </td>
    </tr>
  </table>
</body>
</html>"""

    response = requests.post(
        f"https://api.mailgun.net/v3/{domain}/messages",
        auth=("api", api_key),
        data={
            "from": f"Heximus AI Platform <postmaster@{domain}>",
            "to": email,
            "subject": subject,
            "html": wrapped_html,
        },
    )

    if not response.ok:
        print(f"[mail_sender] Errore Mailgun: {response.status_code} - {response.text}")
