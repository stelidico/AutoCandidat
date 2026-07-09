const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'development',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, isAdmin: !!user.is_admin },
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
    const resolvedName = (name || email.split('@')[0]).trim();

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
    db.prepare('INSERT INTO users (id, email, password, name, sender_email, applications_bonus) VALUES (?, ?, ?, ?, ?, 10)')
      .run(id, email.trim().toLowerCase(), hash, resolvedName, senderEmailRaw);

    const user = { id, email: email.trim().toLowerCase(), name: resolvedName, sender_email: senderEmailRaw, is_admin: 0 };
    res.cookie('token', signToken(user), COOKIE_OPTS);
    res.status(201).json({ id: user.id, email: user.email, name: user.name, sender_email: user.sender_email, isAdmin: false });
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
    if (user.suspended) {
      return res.status(403).json({ error: 'Compte suspendu. Contactez le support.' });
    }

    res.cookie('token', signToken(user), COOKIE_OPTS);
    res.json({ id: user.id, email: user.email, name: user.name, sender_email: user.sender_email, isAdmin: !!user.is_admin });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, sender_email, plan, applications_bonus, is_admin FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({ ...user, isAdmin: !!user.is_admin });
});

// GET /api/users/me/export — export all user data as PDF (RGPD portabilité)
router.get('/me/export', requireAuth, (req, res) => {
  const PDFDocument = require('pdfkit');
  const user = db.prepare('SELECT id, email, name, sender_email, plan, applications_bonus, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

  const applications = db.prepare('SELECT company, job_title, offer_url, status, applied_at, notes, location, email_used, created_at FROM applications WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const emailAccounts = db.prepare('SELECT provider, label, email_address, created_at FROM email_accounts WHERE user_id = ?').all(req.user.id);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Disposition', 'attachment; filename="mes-donnees-autocandidat.pdf"');
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  const COLOR_TITLE = '#557A95';
  const COLOR_LABEL = '#5D5C61';
  const COLOR_VALUE = '#333333';
  const COLOR_LIGHT = '#7395AE';

  const fmt = (ts) => ts ? new Date(ts * 1000).toLocaleDateString('fr-FR') : '—';
  const planLabel = user.plan === 'premium' ? 'Forfait 49,99€' : user.plan === 'boost' ? 'Forfait 19,99€' : 'Essai gratuit';

  doc.fontSize(20).fillColor(COLOR_TITLE).text('Mes données personnelles', { align: 'center' });
  doc.fontSize(9).fillColor(COLOR_LIGHT).text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} — autocandidat.fr`, { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(13).fillColor(COLOR_TITLE).text('Profil');
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#d5cdc9').lineWidth(1).stroke();
  doc.moveDown(0.4);

  const profileFields = [
    ['Nom', user.name || '—'],
    ['Email de connexion', user.email],
    ['Email de candidature', user.sender_email || '—'],
    ['Forfait', planLabel],
    ['Crédits restants', String(user.applications_bonus || 0)],
    ['Membre depuis', fmt(user.created_at)],
  ];
  for (const [label, value] of profileFields) {
    doc.fontSize(9).fillColor(COLOR_LABEL).text(label + ' :', { continued: true }).fillColor(COLOR_VALUE).text('  ' + value);
  }
  doc.moveDown(1.5);

  doc.fontSize(13).fillColor(COLOR_TITLE).text('Comptes email connectés');
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#d5cdc9').lineWidth(1).stroke();
  doc.moveDown(0.4);

  if (emailAccounts.length === 0) {
    doc.fontSize(9).fillColor(COLOR_LIGHT).text('Aucun compte email connecté.');
  } else {
    for (const acc of emailAccounts) {
      doc.fontSize(9).fillColor(COLOR_LABEL).text(`• ${acc.email_address}`, { continued: true })
        .fillColor(COLOR_LIGHT).text(`  (${acc.provider} — ajouté le ${fmt(acc.created_at)})`);
    }
  }
  doc.moveDown(1.5);

  doc.fontSize(13).fillColor(COLOR_TITLE).text(`Candidatures (${applications.length})`);
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#d5cdc9').lineWidth(1).stroke();
  doc.moveDown(0.4);

  if (applications.length === 0) {
    doc.fontSize(9).fillColor(COLOR_LIGHT).text('Aucune candidature enregistrée.');
  } else {
    for (const app of applications) {
      if (doc.y > 720) doc.addPage();
      doc.fontSize(9).fillColor(COLOR_VALUE).text(`${app.job_title} — ${app.company}`, { continued: true })
        .fillColor(COLOR_LIGHT).text(`  (${app.status} · ${fmt(app.applied_at)})`);
      if (app.location) doc.fontSize(8).fillColor(COLOR_LIGHT).text(`  Lieu : ${app.location}`);
      if (app.email_used) doc.fontSize(8).fillColor(COLOR_LIGHT).text(`  Email : ${app.email_used}`);
      doc.moveDown(0.3);
    }
  }

  doc.moveDown(2);
  doc.fontSize(8).fillColor(COLOR_LIGHT).text('Document généré conformément au RGPD (art. 15 et 20) — Autocandidat · contact@autocandidat.fr', { align: 'center' });
  doc.end();
});

// DELETE /api/users/me — delete own account (RGPD effacement)
router.delete('/me', requireAuth, async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    if (user.password && password) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    res.clearCookie('token', { path: '/' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/me — update profile
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
