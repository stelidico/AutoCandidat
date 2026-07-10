const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

router.use(requireAuth, requireAdmin);

// ─── Helper audit log ─────────────────────────────────────────────────────────
function logAudit(adminId, action, targetType, targetId, detail = {}) {
  try {
    db.prepare(`
      INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, detail)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), adminId, action, targetType, String(targetId), JSON.stringify(detail));
  } catch (_) {}
}

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const week  = Math.floor(Date.now() / 1000) - 7 * 86400;
  const month = Math.floor(Date.now() / 1000) - 30 * 86400;

  const users      = db.prepare('SELECT COUNT(*) as total FROM users WHERE is_admin = 0').get();
  const premium    = db.prepare("SELECT COUNT(*) as c FROM users WHERE plan = 'premium' AND is_admin = 0").get();
  const suspended  = db.prepare('SELECT COUNT(*) as c FROM users WHERE suspended = 1').get();
  const appsTotal  = db.prepare('SELECT COUNT(*) as c FROM applications').get();
  const appsMonth  = db.prepare('SELECT COUNT(*) as c FROM applications WHERE created_at > ?').get(month);
  const campTotal  = db.prepare('SELECT COUNT(*) as c FROM campaigns').get();
  const campRun    = db.prepare("SELECT COUNT(*) as c FROM campaigns WHERE status = 'running'").get();
  const aiTotal    = db.prepare('SELECT COUNT(*) as c, SUM(input_tokens) as inp, SUM(output_tokens) as out FROM ai_usage').get();
  const smtpOk     = db.prepare("SELECT COUNT(*) as c FROM smtp_log WHERE status = 'ok' AND created_at > ?").get(week);
  const smtpErr    = db.prepare("SELECT COUNT(*) as c FROM smtp_log WHERE status = 'error' AND created_at > ?").get(week);
  const smtpTotal  = (smtpOk.c || 0) + (smtpErr.c || 0);
  const testPend   = db.prepare("SELECT COUNT(*) as c FROM testimonials WHERE status = 'pending'").get();
  const supportOpen     = db.prepare("SELECT COUNT(*) as c FROM contact_messages WHERE status = 'open'").get();
  const supportPriority = db.prepare("SELECT COUNT(*) as c FROM contact_messages WHERE status = 'open' AND is_priority = 1").get();

  res.json({
    users:        { total: users.total, premium: premium.c, suspended: suspended.c },
    applications: { total: appsTotal.c, this_month: appsMonth.c },
    campaigns:    { total: campTotal.c, running: campRun.c },
    ai: {
      total_calls:         aiTotal.c   || 0,
      total_input_tokens:  aiTotal.inp || 0,
      total_output_tokens: aiTotal.out || 0,
    },
    smtp: {
      ok_7d:         smtpOk.c  || 0,
      error_7d:      smtpErr.c || 0,
      error_rate_7d: smtpTotal > 0 ? Math.round((smtpErr.c / smtpTotal) * 100) / 100 : 0,
    },
    testimonials: { pending: testPend.c || 0 },
    support: { open: supportOpen.c || 0, priority: supportPriority.c || 0 },
  });
});

// ─── GET /api/admin/visits ────────────────────────────────────────────────────
router.get('/visits', (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 90);
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  // Daily visits grouped by date
  const daily = db.prepare(`
    SELECT date(created_at, 'unixepoch') as day, COUNT(*) as visits
    FROM page_views
    WHERE created_at >= ?
    GROUP BY day
    ORDER BY day ASC
  `).all(since);

  // Total & today
  const total = db.prepare('SELECT COUNT(*) as c FROM page_views').get();
  const todayStart = Math.floor(new Date().setHours(0,0,0,0) / 1000);
  const today = db.prepare('SELECT COUNT(*) as c FROM page_views WHERE created_at >= ?').get(todayStart);

  // Top pages
  const topPages = db.prepare(`
    SELECT path, COUNT(*) as visits
    FROM page_views
    WHERE created_at >= ?
    GROUP BY path
    ORDER BY visits DESC
    LIMIT 10
  `).all(since);

  // Top cities
  const topCities = db.prepare(`
    SELECT city, country, COUNT(*) as visits
    FROM page_views
    WHERE created_at >= ? AND city != ''
    GROUP BY city, country
    ORDER BY visits DESC
    LIMIT 15
  `).all(since);

  res.json({ daily, total: total.c, today: today.c, topPages, topCities });
});

// ─── DELETE /api/admin/page-views ────────────────────────────────────────────
router.delete('/page-views', (req, res) => {
  db.prepare('DELETE FROM page_views').run();
  res.json({ ok: true });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', (req, res) => {
  const { plan = '', search = '', page = 1 } = req.query;
  const limit = 50;
  const offset = (Number(page) - 1) * limit;

  let where = 'WHERE is_admin = 0';
  const params = [];
  if (plan && ['free', 'premium'].includes(plan)) {
    where += ' AND plan = ?';
    params.push(plan);
  }
  if (search) {
    where += ' AND (email LIKE ? OR name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const rows = db.prepare(`
    SELECT id, email, name, plan, suspended, applications_bonus, letters_this_month, premium_until, created_at
    FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`SELECT COUNT(*) as c FROM users ${where}`).get(...params);
  res.json({ users: rows, total: total.c, page: Number(page), limit });
});

// ─── PATCH /api/admin/users/:id ───────────────────────────────────────────────
router.patch('/users/:id', (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

  const { applications_bonus, letters_this_month, plan, suspended } = req.body;
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    UPDATE users SET
      applications_bonus   = COALESCE(?, applications_bonus),
      letters_this_month   = COALESCE(?, letters_this_month),
      plan                 = COALESCE(?, plan),
      suspended            = COALESCE(?, suspended)
    WHERE id = ?
  `).run(
    applications_bonus ?? null,
    letters_this_month ?? null,
    plan ?? null,
    suspended !== undefined ? (suspended ? 1 : 0) : null,
    id
  );

  logAudit(req.user.id, 'edit_user', 'user', id, { before: { applications_bonus: user.applications_bonus, plan: user.plan, suspended: user.suspended }, body: req.body });

  const updated = db.prepare('SELECT id, email, name, plan, suspended, applications_bonus, letters_this_month, premium_until, created_at FROM users WHERE id = ?').get(id);
  res.json(updated);
});

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

  logAudit(req.user.id, 'delete_user', 'user', id, { email: user.email });
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.status(204).end();
});

// ─── POST /api/admin/users/:id/purge ─────────────────────────────────────────
router.post('/users/:id/purge', (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Impossible de purger votre propre compte' });
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

  db.transaction(() => {
    db.prepare('DELETE FROM applications WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM campaigns WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM email_accounts WHERE user_id = ?').run(id);
    db.prepare('UPDATE ai_usage SET user_id = NULL WHERE user_id = ?').run(id);
    db.prepare("UPDATE users SET name = '[Anonymisé]', email = ?, sender_email = '' WHERE id = ?")
      .run(`anonymized-${id}@deleted.local`, id);
  })();

  logAudit(req.user.id, 'purge_user', 'user', id, { original_email: user.email });
  res.json({ ok: true });
});

// ─── GET /api/admin/testimonials ──────────────────────────────────────────────
router.get('/testimonials', (req, res) => {
  const { status = 'all' } = req.query;
  const where = status !== 'all' ? 'WHERE status = ?' : '';
  const params = status !== 'all' ? [status] : [];
  const rows = db.prepare(`SELECT * FROM testimonials ${where} ORDER BY created_at DESC`).all(...params);
  res.json(rows);
});

// ─── PATCH /api/admin/testimonials/:id ───────────────────────────────────────
router.patch('/testimonials/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(422).json({ error: 'status invalide' });
  }
  const t = db.prepare('SELECT id FROM testimonials WHERE id = ?').get(id);
  if (!t) return res.status(404).json({ error: 'Témoignage non trouvé' });

  db.prepare('UPDATE testimonials SET status = ? WHERE id = ?').run(status, id);
  logAudit(req.user.id, 'moderate_testimonial', 'testimonial', id, { status });
  res.json(db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id));
});

// ─── DELETE /api/admin/testimonials/:id ──────────────────────────────────────
router.delete('/testimonials/:id', (req, res) => {
  const t = db.prepare('SELECT id FROM testimonials WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Témoignage non trouvé' });
  logAudit(req.user.id, 'delete_testimonial', 'testimonial', req.params.id, {});
  db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ─── GET /api/admin/ai-usage ──────────────────────────────────────────────────
router.get('/ai-usage', (req, res) => {
  const days  = Math.min(Number(req.query.days) || 7, 90);
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const byDay = db.prepare(`
    SELECT date(created_at, 'unixepoch') as day,
           COUNT(*) as calls,
           SUM(input_tokens)  as total_in,
           SUM(output_tokens) as total_out
    FROM ai_usage WHERE created_at > ?
    GROUP BY day ORDER BY day ASC
  `).all(since);

  const summary = db.prepare(`
    SELECT COUNT(*) as total_calls,
           SUM(input_tokens)  as total_in,
           SUM(output_tokens) as total_out
    FROM ai_usage WHERE created_at > ?
  `).get(since);

  const recent = db.prepare(`
    SELECT a.id, a.created_at, a.model, a.action, a.input_tokens, a.output_tokens, a.user_id,
           u.email as user_email
    FROM ai_usage a LEFT JOIN users u ON a.user_id = u.id
    WHERE a.created_at > ? ORDER BY a.created_at DESC LIMIT 30
  `).all(since);

  res.json({ by_day: byDay, summary, recent });
});

// ─── GET /api/admin/smtp-log ──────────────────────────────────────────────────
router.get('/smtp-log', (req, res) => {
  const { status = 'all', days = 7, page = 1 } = req.query;
  const since = Math.floor(Date.now() / 1000) - Math.min(Number(days), 90) * 86400;
  const limit = 50;
  let where = 'WHERE s.created_at > ?';
  const params = [since];
  if (status !== 'all') { where += ' AND s.status = ?'; params.push(status); }

  const rows = db.prepare(`
    SELECT s.*, u.email as user_email, c.name as campaign_name
    FROM smtp_log s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN campaigns c ON s.campaign_id = c.id
    ${where} ORDER BY s.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, (Number(page) - 1) * limit);
  res.json(rows);
});

// ─── GET /api/admin/audit-log ─────────────────────────────────────────────────
router.get('/audit-log', (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 50;
  const rows = db.prepare(`
    SELECT a.*, u.email as admin_email
    FROM admin_audit_log a LEFT JOIN users u ON a.admin_id = u.id
    ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, (page - 1) * limit);
  const total = db.prepare('SELECT COUNT(*) as c FROM admin_audit_log').get();
  res.json({ logs: rows, total: total.c, page, limit });
});

// ─── GET /api/admin/support ───────────────────────────────────────────────────
// Messages de contact, triés priorité (Premium) d'abord puis plus récents,
// pour garantir que le "Support prioritaire" du forfait 49,99€ est bien honoré.
router.get('/support', (req, res) => {
  const { status = 'open' } = req.query;
  const where = status !== 'all' ? 'WHERE m.status = ?' : '';
  const params = status !== 'all' ? [status] : [];
  const rows = db.prepare(`
    SELECT m.*, u.plan as user_plan
    FROM contact_messages m LEFT JOIN users u ON m.user_id = u.id
    ${where}
    ORDER BY m.is_priority DESC, m.created_at ASC
  `).all(...params);
  res.json(rows);
});

// ─── PATCH /api/admin/support/:id ─────────────────────────────────────────────
router.patch('/support/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['open', 'resolved'].includes(status)) {
    return res.status(422).json({ error: 'status invalide' });
  }
  const m = db.prepare('SELECT id FROM contact_messages WHERE id = ?').get(id);
  if (!m) return res.status(404).json({ error: 'Message non trouvé' });

  db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, id);
  logAudit(req.user.id, 'resolve_support_message', 'contact_message', id, { status });
  res.json(db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id));
});

// ─── GET /api/admin/settings ──────────────────────────────────────────────────
router.get('/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const { key, value } of rows) settings[key] = value;
  res.json(settings);
});

// ─── PATCH /api/admin/settings ────────────────────────────────────────────────
router.patch('/settings', (req, res) => {
  const allowed = ['legal_address'];
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  const entries = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!entries.length) return res.status(422).json({ error: 'Aucun champ valide' });

  db.transaction(() => {
    for (const [key, value] of entries) upsert.run(key, String(value));
  })();

  logAudit(req.user.id, 'edit_settings', 'settings', 'legal', { keys: entries.map(([k]) => k) });
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const { key, value } of rows) settings[key] = value;
  res.json(settings);
});

module.exports = router;
