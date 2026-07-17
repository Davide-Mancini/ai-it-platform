# Dockerfile di SVILUPPO: hot-reload via uvicorn --reload + codice montato
# come volume da docker-compose. Non adatto alla produzione così com'è
# (vedi nota nel README / conversazione: per prod serve un build separato
# senza --reload, senza mount del codice, con utente non-root).

FROM python:3.14-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--timeout-graceful-shutdown", "3"]
