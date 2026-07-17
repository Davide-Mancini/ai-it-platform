# Dockerfile di SVILUPPO: vite dev server con hot-reload + codice montato
# come volume da docker-compose. Non adatto alla produzione così com'è
# (per prod serve un multi-stage build: "npm run build" e poi servire
# i file statici con un web server tipo nginx, niente vite dev server).

FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
