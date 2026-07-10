// ─── Capture crashes au démarrage ────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[CRASH] uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRASH] unhandledRejection:', reason);
  process.exit(1);
});

console.log('[BOOT] Starting server...');

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

dotenv.config();
console.log('[BOOT] env PORT =', process.env.PORT);

const logger = require('./logger');
const db = require('./db');
console.log('[BOOT] logger OK');

if (!process.env.ENCRYPTION_KEY && !process.env.JWT_SECRET) {
  logger.warn('ENCRYPTION_KEY et JWT_SECRET absents : les identifiants SMTP/OAuth en base seront chiffrés avec une clé de repli publique (fallback-dev-key-change-me). Définissez ENCRYPTION_KEY en production.');
}

const { startWorker } = require('./worker');
console.log('[BOOT] worker OK');

const app = express();

// ─── Trust proxy (requis sur Railway/Render/Heroku derrière un reverse proxy) ─
app.set('trust proxy', 1);

// ─── Health check (avant tout middleware pour Railway) ────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Email open tracking pixel ────────────────────────────────────────────────
const TRACKING_PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
app.get('/track/open/:trackingId', (req, res) => {
  try {
    db.prepare(
      'UPDATE applications SET email_opened_at = ? WHERE tracking_id = ? AND email_opened_at IS NULL'
    ).run(Math.floor(Date.now() / 1000), req.params.trackingId);
  } catch (_) {}
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.end(TRACKING_PIXEL);
});

// ─── Stripe webhook — raw body AVANT express.json ────────────────────────────
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), require('./routes/stripeWebhook'));

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ─── Rate limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
});

app.use('/api', generalLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/api'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/promo', require('./routes/promo'));
app.get('/api/testimonials', (_req, res) => {
  res.json(db.prepare("SELECT * FROM testimonials WHERE status = 'approved' ORDER BY created_at DESC").all());
});

app.post('/api/testimonials', require('./middleware/auth'), (req, res) => {
  const { name, role, text, stars } = req.body;
  if (!name || !text) return res.status(422).json({ error: 'Nom et texte requis.' });
  const starsVal = Math.min(5, Math.max(1, parseInt(stars) || 5));
  const avatar = name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const now = new Date();
  const date = `${months[now.getMonth()]} ${now.getFullYear()}`;
  const { v4: uuidv4 } = require('uuid');
  db.prepare(`
    INSERT INTO testimonials (id, user_id, name, role, avatar, text, stars, date, status, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'user')
  `).run(uuidv4(), req.user.id, name.trim().slice(0, 60), (role || '').trim().slice(0, 80), avatar, text.trim().slice(0, 500), starsVal, date);
  res.json({ ok: true });
});
// ─── Page view tracking ───────────────────────────────────────────────────────
const { v4: uuidv4pv } = require('uuid');
const geoCache = new Map(); // ip → { city, country }

async function lookupGeo(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { city: '', country: '' };
  }
  if (geoCache.has(ip)) return geoCache.get(ip);
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const r = await fetch(`http://ip-api.com/json/${ip}?fields=city,countryCode&lang=fr`, { signal: ctrl.signal });
    clearTimeout(t);
    if (r.ok) {
      const d = await r.json();
      const result = { city: d.city || '', country: d.countryCode || '' };
      if (geoCache.size > 2000) geoCache.delete(geoCache.keys().next().value);
      geoCache.set(ip, result);
      return result;
    }
  } catch (_) {}
  return { city: '', country: '' };
}

app.post('/api/track/pageview', (req, res) => {
  res.json({ ok: true });
  try {
    const ua = req.headers['user-agent'] || '';
    if (/bot|crawl|spider|slurp|curl|wget|python|java|go-http/i.test(ua)) return;
    const { path = '/', referrer = '' } = req.body;
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const id = uuidv4pv();
    db.prepare('INSERT INTO page_views (id, path, referrer, city, country) VALUES (?, ?, ?, ?, ?)').run(id, String(path).slice(0, 200), String(referrer).slice(0, 500), '', '');
    lookupGeo(ip).then(({ city, country }) => {
      if (city) db.prepare('UPDATE page_views SET city = ?, country = ? WHERE id = ?').run(city, country, id);
    }).catch(() => {});
  } catch (_) {}
});

app.get('/api/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const { key, value } of rows) settings[key] = value;
  res.json(settings);
});

app.post('/api/contact', async (req, res) => {
  const { email, name, subject, objet, content } = req.body;
  if (!email || !content) return res.status(422).json({ error: 'Email et contenu requis.' });

  // Identification optionnelle de l'utilisateur connecté, pour prioriser les clients premium
  // (Support prioritaire — forfait 49,99€). Ne bloque jamais l'envoi si absent/invalide.
  let userId = null;
  let isPriority = false;
  try {
    const token = req.cookies?.token;
    if (token) {
      const payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      const user = db.prepare('SELECT id, plan FROM users WHERE id = ?').get(payload.sub);
      if (user) {
        userId = user.id;
        isPriority = user.plan === 'premium';
      }
    }
  } catch (_) {}

  db.prepare(`
    INSERT INTO contact_messages (id, user_id, is_priority, name, email, subject, objet, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(require('uuid').v4(), userId, isPriority ? 1 : 0, (name || '').trim().slice(0, 100), email.trim().slice(0, 200), (subject || '').trim().slice(0, 100), (objet || '').trim().slice(0, 200), content.trim().slice(0, 5000));

  const to = process.env.CONTACT_EMAIL || 'contact@autocandidat.fr';
  const from = process.env.RESEND_FROM || 'contact@autocandidat.fr';
  const text = `De: ${name || 'N/A'}\nEmail: ${email}\nSujet: ${subject || 'N/A'}\nObjet: ${objet || 'N/A'}\n\n${content}`;
  const emailSubject = `${isPriority ? '🔴 [PRIORITAIRE] ' : ''}[Contact Autocandidat] ${subject || objet || 'Message'}`;

  try {
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject: emailSubject, text }),
      });
    } else {
      const { sendEmail } = require('./email');
      await sendEmail({ from, to, subject: emailSubject, text });
    }
  } catch (err) {
    logger.error('Contact email failed', { err: err.message });
  }

  res.json({ ok: true });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fichier trop volumineux (max 5 Mo)' });
  }
  if (err.message === 'Seuls les fichiers PDF sont acceptés') {
    return res.status(400).json({ error: err.message });
  }
  logger.error('Unhandled error', { err: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ─── Graceful shutdown (Railway envoie SIGTERM au redéploiement) ──────────────
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}, shutting down...`);
  try { db.pragma('wal_checkpoint(TRUNCATE)'); db.close(); } catch (_) {}
  process.exit(0);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// ─── Start ────────────────────────────────────────────────────────────────────
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`[BOOT] Server listening on port ${port}`);
  logger.info(`Server running on port ${port}`, { env: process.env.NODE_ENV || 'development' });
  startWorker();
});
