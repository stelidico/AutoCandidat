const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const requireAuth = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/users/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, sender_email } = req.body;

    if (!email || typeof email !== 'string' || !/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) {
      return res.status(422).json({ error: 'Email de connexion invalide' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(422).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(422).json({ error: 'Le nom est requis' });
    }

    // sender_email defaults to the login email if not provided
    const senderEmailRaw = (sender_email || email).trim().toLowerCase();
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(senderEmailRaw)) {
      return res.status(422).json({ error: 'Email de candidature invalide' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, email, password, name, sender_email) VALUES (?, ?, ?, ?, ?)')
      .run(id, email.trim().toLowerCase(), hash, name.trim(), senderEmailRaw);

    const user = { id, email: email.trim().toLowerCase(), name: name.trim(), sender_email: senderEmailRaw };
    const token = signToken(user);
    res.status(201).json({ ...user, token });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = signToken(user);
    res.json({ id: user.id, email: user.email, name: user.name, sender_email: user.sender_email, token });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, sender_email FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json(user);
});

// PATCH /api/users/me — update profile (name and/or sender_email)
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, sender_email } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(422).json({ error: 'Le nom ne peut pas être vide' });
    }
    if (sender_email !== undefined) {
      if (typeof sender_email !== 'string' || !/^[^@]+@[^@]+\.[^@]+$/.test(sender_email.trim())) {
        return res.status(422).json({ error: 'Email de candidature invalide' });
      }
    }

    db.prepare(`
      UPDATE users SET
        name         = COALESCE(?, name),
        sender_email = COALESCE(?, sender_email)
      WHERE id = ?
    `).run(name ? name.trim() : null, sender_email ? sender_email.trim().toLowerCase() : null, req.user.id);

    const updated = db.prepare('SELECT id, email, name, sender_email FROM users WHERE id = ?').get(req.user.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
