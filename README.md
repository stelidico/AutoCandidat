# Autocandidat (scaffold)

Projet pour automatiser candidatures avec IA.

Structure:
- `server/` : backend Express minimal (API OpenAI, envoi email)
- `client/` : frontend Vite + React démo

Quick start:

1. Backend

```bash
cd server
npm install
cp .env.example .env   # remplir les variables
npm run start
```

2. Frontend

```bash
cd client
npm install
npm run dev
```

API endpoints:
- `POST /api/upload` : upload de fichier (multer)
- `POST /api/generate` : génère lettre via OpenAI
- `POST /api/send-email` : envoi d'email via SMTP
