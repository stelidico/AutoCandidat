# Autocandidat

SaaS d'automatisation de candidatures par IA : upload de CV, analyse et génération de lettres de motivation via Claude (Anthropic), recherche d'offres multi-source (France Travail, Adzuna, Jooble), envoi automatique des candidatures par email et suivi façon ATS.

Structure :
- `server/` : API Express + SQLite (auth JWT, OAuth Gmail, Stripe, IA, envoi d'emails, jobs asynchrones)
- `client/` : frontend Vite + React + Tailwind

Déployé en production : backend sur Railway, frontend sur Vercel.

## Démarrage local

1. Backend

```bash
cd server
npm install
cp .env.example .env   # remplir les variables (voir détail dans server/.env.example)
npm run dev
```

2. Frontend

```bash
cd client
npm install
npm run dev
```

## Fonctionnalités principales

- **Auth** : email/mot de passe (JWT en cookie httpOnly) + connexion Gmail OAuth2
- **CV & lettres** : upload PDF, extraction de texte, analyse IA (compétences/expériences), génération de lettre de motivation (Claude), régénération avec instructions (plus courte, plus formelle, etc.)
- **Candidature automatique** : recherche et fusion d'offres (France Travail, Adzuna, Jooble), sélection des entreprises les plus pertinentes par IA, envoi en masse des candidatures avec CV joint, relance automatique à J+7 si l'email n'a pas été ouvert
- **Comptes email** : connexion Gmail (OAuth2) ou SMTP générique (Orange, SFR, Outlook, Yahoo, etc.)
- **ATS** : suivi des candidatures envoyées (statuts, stats)
- **Entreprises** : recherche d'entreprises via l'API SIRENE (recherche-entreprises.api.gouv.fr)
- **Paiement** : forfaits payants via Stripe (boost / premium)
- **Admin** : statistiques, gestion des utilisateurs, modération des témoignages, usage IA, logs SMTP, journal d'audit
- **RGPD** : export et suppression des données utilisateur

## Endpoints API (aperçu)

- `POST /api/users/register`, `/login`, `/logout`, `GET /me`, `GET /me/export`, `DELETE /me`
- `POST /api/upload` (PDF), `POST /api/analyze`, `POST /api/generate`, `POST /api/send-email`
- `GET/POST/DELETE /api/accounts` (comptes email)
- `GET /api/jobs/search`, `POST /api/jobs/match`, `POST /api/jobs/auto-apply`
- `GET/POST/PUT/DELETE /api/applications` (ATS)
- `GET /api/stripe/status`, `POST /api/stripe/create-checkout-session`
- `GET /auth/google/url`, `GET /auth/google/callback`
- `GET /api/companies/search`
- `GET/PATCH/DELETE /api/admin/*` (réservé aux administrateurs)

## Tests & CI

- Backend : Jest + Supertest (`cd server && npm test`)
- Frontend : Vitest + Testing Library (`cd client && npm test`)
- GitHub Actions (`.github/workflows/ci.yml`) exécute les deux suites et le build client sur chaque push/PR.
