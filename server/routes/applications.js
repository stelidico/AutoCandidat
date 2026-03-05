const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const VALID_STATUSES = ['draft', 'sent', 'waiting', 'response', 'interview', 'refused', 'accepted'];

// ─── GET /api/applications ────────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM applications WHERE user_id = ?';
  const params = [req.user.id];
  if (status && VALID_STATUSES.includes(status)) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY updated_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// ─── GET /api/applications/stats ─────────────────────────────────────────────
router.get('/stats', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT status, COUNT(*) as count FROM applications WHERE user_id = ? GROUP BY status'
  ).all(req.user.id);
  const stats = Object.fromEntries(VALID_STATUSES.map((s) => [s, 0]));
  rows.forEach((r) => { stats[r.status] = r.count; });
  res.json(stats);
});

// ─── POST /api/applications ───────────────────────────────────────────────────
router.post('/', requireAuth, (req, res, next) => {
  try {
    const { company, job_title, offer_url = '', status = 'draft', applied_at,
            notes = '', salary = '', location = '', contact_name = '', contact_email = '' } = req.body;

    if (!company || typeof company !== 'string' || !company.trim()) {
      return res.status(422).json({ error: 'company est requis' });
    }
    if (!job_title || typeof job_title !== 'string' || !job_title.trim()) {
      return res.status(422).json({ error: 'job_title est requis' });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(422).json({ error: 'status invalide' });
    }

    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO applications
        (id, user_id, company, job_title, offer_url, status, applied_at,
         notes, salary, location, contact_name, contact_email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user.id,
      company.trim(), job_title.trim(), offer_url.trim(), status,
      applied_at || (status === 'sent' ? now : null),
      notes.trim(), salary.trim(), location.trim(),
      contact_name.trim(), contact_email.trim(),
      now, now
    );

    res.status(201).json(db.prepare('SELECT * FROM applications WHERE id = ?').get(id));
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/applications/:id ────────────────────────────────────────────────
router.put('/:id', requireAuth, (req, res, next) => {
  try {
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!app) return res.status(404).json({ error: 'Candidature non trouvée' });
    if (app.user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });

    const { company, job_title, offer_url, status, applied_at, notes,
            salary, location, contact_name, contact_email } = req.body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(422).json({ error: 'status invalide' });
    }

    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      UPDATE applications SET
        company       = COALESCE(?, company),
        job_title     = COALESCE(?, job_title),
        offer_url     = COALESCE(?, offer_url),
        status        = COALESCE(?, status),
        applied_at    = COALESCE(?, applied_at),
        notes         = COALESCE(?, notes),
        salary        = COALESCE(?, salary),
        location      = COALESCE(?, location),
        contact_name  = COALESCE(?, contact_name),
        contact_email = COALESCE(?, contact_email),
        updated_at    = ?
      WHERE id = ?
    `).run(
      company ?? null, job_title ?? null, offer_url ?? null, status ?? null,
      applied_at ?? null, notes ?? null, salary ?? null, location ?? null,
      contact_name ?? null, contact_email ?? null,
      now, req.params.id
    );

    res.json(db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id));
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/applications/:id ─────────────────────────────────────────────
router.delete('/:id', requireAuth, (req, res, next) => {
  try {
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!app) return res.status(404).json({ error: 'Candidature non trouvée' });
    if (app.user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
