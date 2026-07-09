# Autocandidat — server

API Express + SQLite (better-sqlite3). Auth JWT (cookie httpOnly), OAuth2 Gmail, IA Claude (Anthropic) pour l'analyse de CV et la génération de lettres, agrégation d'offres d'emploi (France Travail, Adzuna, Jooble, JSearch), paiement Stripe, envoi d'emails (Nodemailer + Resend en fallback), file de jobs asynchrones (`worker.js`) pour les campagnes et l'auto-candidature.

## Démarrage

```bash
npm install
cp .env.example .env   # remplir les variables, voir les commentaires du fichier
npm run dev             # nodemon
npm start                # production
npm test                 # Jest + Supertest (base SQLite en mémoire)
```

## Arborescence

- `index.js` — point d'entrée, sécurité (helmet, CORS, rate limiting), montage des routes
- `db.js` — schéma SQLite et migrations
- `openai.js` — génération de lettres (Claude, malgré le nom du fichier)
- `analysis.js` — analyse de CV (Claude + extraction regex en fallback)
- `pdf.js` — extraction de texte PDF
- `email.js` — envoi SMTP/OAuth2 Gmail (Nodemailer)
- `crypto.js` — chiffrement AES-256-GCM des identifiants stockés en base
- `worker.js` — file de jobs (campagnes, auto-candidature, relances J+7)
- `adzuna.js`, `francetravail.js`, `jooble.js`, `jsearch.js` — agrégateurs d'offres (JSearch agrège Google for Jobs, incluant LinkedIn/Indeed/Glassdoor)
- `auth/google.js` — OAuth2 Google
- `middleware/` — auth JWT, contrôle admin, quotas
- `routes/` — un fichier par domaine (users, api, jobs, applications, stripe, auth, admin, companies, promo)

Déploiement : `Dockerfile`, `Procfile`, `railway.toml`, `fly.toml` (Railway utilisé en production).
