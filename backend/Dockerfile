# Il CMD di base (senza --reload) è quello usato per il build di produzione
# (es. Render). Per lo sviluppo locale, docker-compose.yml sovrascrive il
# comando aggiungendo --reload e monta il codice come volume per l'hot-reload.

FROM python:3.14-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--timeout-graceful-shutdown", "3"]
