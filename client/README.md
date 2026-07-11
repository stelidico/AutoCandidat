# Autocandidat — client

Frontend Vite + React + Tailwind CSS. Déployé sur Vercel (voir `vercel.json` pour les rewrites `/api`, `/auth`, `/track` vers l'API Railway).

## Démarrage

```bash
npm install
npm run dev       # dev server (proxy /api et /auth vers localhost:4000)
npm run build     # build production
npm test          # Vitest + Testing Library
```

## Pages principales

- `LandingPage`, `Login`, `Register` — accueil et authentification
- `Dashboard` (`/app`) — upload/analyse de CV, génération de lettre, candidature automatique
- `ATSPage` (`/ats`) — suivi des candidatures envoyées
- `EmailPage` (`/email`) — connexion Gmail OAuth2 ou compte SMTP
- `PricingPage`, `AccountSettingsPage`, `AdminPage` (réservé aux admins)

