const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

dotenv.config();

const logger = require('./logger');
const { startWorker } = require('./worker');

const app = express();

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());

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
app.use('/auth', require('./routes/auth'));

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

// ─── Start ────────────────────────────────────────────────────────────────────
const port = process.env.PORT || 4000;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`, { env: process.env.NODE_ENV || 'development' });
  startWorker();
});
