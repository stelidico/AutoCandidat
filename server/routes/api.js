const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const db = require('../db');
const { encrypt, decrypt } = require('../crypto');
const requireAuth = require('../middleware/auth');
const { checkLetterQuota, incrementLetters } = require('../middleware/quota');
const { analyzeText } = require('../analysis');
const { generateCoverLetter } = require('../openai');
const { sendEmail } = require('../email');
const { extractTextFromPDF } = require('../pdf');
const logger = require('../logger');

// ─── Multer config ────────────────────────────────────────────────────────────
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Seuls les fichiers PDF sont acceptés'));
    }
    cb(null, true);
  },
});

// ─── CV Upload ────────────────────────────────────────────────────────────────
const CV_STORAGE_DIR = path.join(__dirname, '..', 'data', 'cv_files');

router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });
  try {
    const text = await extractTextFromPDF(req.file.path);

    // Save the PDF for later use as email attachment
    if (!fs.existsSync(CV_STORAGE_DIR)) fs.mkdirSync(CV_STORAGE_DIR, { recursive: true });
    const cvFileId = uuidv4();
    const dest = path.join(CV_STORAGE_DIR, `${cvFileId}.pdf`);
    fs.copyFileSync(req.file.path, dest);
    fs.unlinkSync(req.file.path);

    res.json({ text, originalname: req.file.originalname, size: req.file.size, cvFileId });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});

// ─── CV Analyse ───────────────────────────────────────────────────────────────
router.post('/analyze', requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'text est requis' });
    }
    const result = await analyzeText(text.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Génération lettre ────────────────────────────────────────────────────────
router.post('/generate', requireAuth, checkLetterQuota, async (req, res, next) => {
  try {
    const { cvText, jobDescription, analysis, tone, instruction } = req.body;
    if (!cvText || typeof cvText !== 'string' || cvText.trim().length === 0) {
      return res.status(400).json({ error: 'cvText est requis' });
    }
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
    const letter = await generateCoverLetter({ cvText, jobDescription, analysis, tone, instruction, userId: req.user.id, candidateName: user?.name || '' });
    incrementLetters(req.user.id);
    res.json({ letter });
  } catch (err) {
    next(err);
  }
});

// ─── Envoi email direct ───────────────────────────────────────────────────────
router.post('/send-email', requireAuth, async (req, res, next) => {
  try {
    const { account_id, to, subject, text, html } = req.body;
    if (!account_id || !to || !subject || !text) {
      return res.status(400).json({ error: 'account_id, to, subject, text sont requis' });
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(to.trim())) {
      return res.status(422).json({ error: 'Adresse email destinataire invalide' });
    }

    const account = db.prepare('SELECT * FROM email_accounts WHERE id = ? AND user_id = ?')
      .get(account_id, req.user.id);
    if (!account) return res.status(404).json({ error: 'Compte email non trouvé' });

    const sendOpts = buildSendOpts(account);
    const user = db.prepare('SELECT name, sender_email, email FROM users WHERE id = ?').get(req.user.id);
    const fromName = user?.name || '';
    const senderEmail = user?.sender_email || user?.email || account.email_address;
    const from = fromName ? `"${fromName}" <${senderEmail}>` : senderEmail;
    const info = await sendEmail({ from, to: to.trim(), subject, text, html, ...sendOpts });
    res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    next(err);
  }
});

// ─── Comptes email ────────────────────────────────────────────────────────────
router.get('/accounts', requireAuth, (req, res) => {
  const accounts = db.prepare(
    'SELECT id, provider, label, email_address, created_at FROM email_accounts WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json(accounts);
});

router.post('/accounts', requireAuth, (req, res, next) => {
  try {
    const { label, email_address, smtp } = req.body;
    if (!email_address || !/^[^@]+@[^@]+\.[^@]+$/.test(email_address.trim())) {
      return res.status(422).json({ error: 'email_address invalide' });
    }
    if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
      return res.status(422).json({ error: 'smtp.host, smtp.user et smtp.pass sont requis' });
    }
    if (/gmail/i.test(smtp.host) || /gmail\.com$/i.test(email_address.trim())) {
      return res.status(422).json({ error: 'Gmail ne supporte plus l\'authentification SMTP. Utilisez le bouton "Connecter Gmail" (OAuth) à la place.' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO email_accounts (id, user_id, provider, label, email_address,
        smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass)
      VALUES (?, ?, 'smtp', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user.id,
      (label || email_address.trim()).trim(),
      email_address.trim(),
      smtp.host, smtp.port || 587,
      smtp.secure ? 1 : 0,
      smtp.user, encrypt(smtp.pass)
    );

    const account = db.prepare(
      'SELECT id, provider, label, email_address, created_at FROM email_accounts WHERE id = ?'
    ).get(id);
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
});

router.delete('/accounts/:id', requireAuth, (req, res, next) => {
  try {
    const account = db.prepare('SELECT id, user_id FROM email_accounts WHERE id = ?').get(req.params.id);
    if (!account) return res.status(404).json({ error: 'Compte non trouvé' });
    if (account.user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    db.prepare('DELETE FROM email_accounts WHERE id = ?').run(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── Campagnes ────────────────────────────────────────────────────────────────
router.get('/campaigns', requireAuth, (req, res) => {
  const campaigns = db.prepare(
    `SELECT id, name, status, account_id, created_at, started_at, completed_at,
      json_array_length(targets) AS targets_count,
      json_array_length(results) AS results_count
     FROM campaigns WHERE user_id = ? ORDER BY created_at DESC`
  ).all(req.user.id);
  res.json(campaigns);
});

router.get('/campaigns/:id', requireAuth, (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campagne non trouvée' });
  if (campaign.user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
  res.json({
    ...campaign,
    targets: JSON.parse(campaign.targets || '[]'),
    results: JSON.parse(campaign.results || '[]'),
  });
});

router.post('/campaigns', requireAuth, (req, res, next) => {
  try {
    const { name, account_id, targets, email_subject, email_footer, cv_text, job_description_template } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 200) {
      return res.status(422).json({ error: 'name est requis (max 200 caractères)' });
    }
    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(422).json({ error: 'targets doit être un tableau non vide' });
    }
    if (targets.length > 500) {
      return res.status(422).json({ error: 'targets ne peut pas dépasser 500 entrées' });
    }
    for (const t of targets) {
      if (!t.email || !/^[^@]+@[^@]+\.[^@]+$/.test(t.email)) {
        return res.status(422).json({ error: `Email invalide: ${t.email}` });
      }
    }

    if (account_id) {
      const account = db.prepare('SELECT id FROM email_accounts WHERE id = ? AND user_id = ?')
        .get(account_id, req.user.id);
      if (!account) return res.status(404).json({ error: 'Compte email non trouvé' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO campaigns (id, user_id, account_id, name, email_subject, email_footer,
        cv_text, job_description_template, targets)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user.id, account_id || null,
      name.trim(),
      email_subject || '',
      email_footer || '',
      cv_text || '',
      job_description_template || '',
      JSON.stringify(targets)
    );

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
    res.status(201).json({
      ...campaign,
      targets: JSON.parse(campaign.targets),
      results: JSON.parse(campaign.results),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/campaigns/:id', requireAuth, (req, res, next) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campagne non trouvée' });
    if (campaign.user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (campaign.status === 'running' || campaign.status === 'queued') {
      return res.status(409).json({ error: 'Impossible de modifier une campagne en cours' });
    }

    const { name, account_id, targets, email_subject, email_footer, cv_text, job_description_template } = req.body;

    if (targets !== undefined) {
      if (!Array.isArray(targets) || targets.length === 0) {
        return res.status(422).json({ error: 'targets doit être un tableau non vide' });
      }
      if (targets.length > 500) {
        return res.status(422).json({ error: 'targets ne peut pas dépasser 500 entrées' });
      }
      for (const t of targets) {
        if (!t.email || !/^[^@]+@[^@]+\.[^@]+$/.test(t.email)) {
          return res.status(422).json({ error: `Email invalide: ${t.email}` });
        }
      }
    }

    db.prepare(`
      UPDATE campaigns SET
        name = COALESCE(?, name),
        account_id = CASE WHEN ? IS NOT NULL THEN ? ELSE account_id END,
        email_subject = COALESCE(?, email_subject),
        email_footer = COALESCE(?, email_footer),
        cv_text = COALESCE(?, cv_text),
        job_description_template = COALESCE(?, job_description_template),
        targets = COALESCE(?, targets)
      WHERE id = ?
    `).run(
      name || null,
      account_id, account_id,
      email_subject !== undefined ? email_subject : null,
      email_footer !== undefined ? email_footer : null,
      cv_text !== undefined ? cv_text : null,
      job_description_template !== undefined ? job_description_template : null,
      targets !== undefined ? JSON.stringify(targets) : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    res.json({
      ...updated,
      targets: JSON.parse(updated.targets),
      results: JSON.parse(updated.results),
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/campaigns/:id', requireAuth, (req, res, next) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campagne non trouvée' });
    if (campaign.user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (campaign.status === 'running' || campaign.status === 'queued') {
      return res.status(409).json({ error: 'Impossible de supprimer une campagne en cours' });
    }
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/campaigns/:id/start', requireAuth, (req, res, next) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campagne non trouvée' });
    if (campaign.user_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (campaign.status === 'running' || campaign.status === 'queued') {
      return res.status(409).json({ error: "La campagne est déjà en cours ou en file d'attente" });
    }

    const targets = JSON.parse(campaign.targets || '[]');
    if (targets.length === 0) {
      return res.status(400).json({ error: "La campagne n'a aucune cible" });
    }
    if (!campaign.account_id) {
      return res.status(400).json({ error: "La campagne n'a pas de compte email configuré" });
    }

    db.prepare("UPDATE campaigns SET status = 'queued', results = '[]' WHERE id = ?")
      .run(req.params.id);

    const jobId = uuidv4();
    db.prepare('INSERT INTO jobs (id, type, payload) VALUES (?, ?, ?)')
      .run(jobId, 'campaign_start', JSON.stringify({ campaignId: req.params.id }));

    logger.info('Campaign queued', { campaignId: req.params.id, jobId });
    res.json({ ok: true, campaignId: req.params.id });
  } catch (err) {
    next(err);
  }
});

// ─── Helper: build send options from DB account ───────────────────────────────
function buildSendOpts(account) {
  if (account.provider === 'gmail') {
    if (!account.oauth_refresh_token) {
      throw new Error(`Le compte Gmail ${account.email_address} n'est pas correctement connecté. Reconnectez-le via OAuth dans la section Comptes Email.`);
    }
    return {
      oauth: {
        type: 'oauth2',
        user: account.email_address,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: decrypt(account.oauth_refresh_token),
        accessToken: decrypt(account.oauth_access_token),
      },
    };
  }
  if (account.smtp_host) {
    return {
      smtp: {
        host: account.smtp_host,
        port: account.smtp_port || 587,
        secure: account.smtp_secure === 1,
        user: account.smtp_user,
        pass: decrypt(account.smtp_pass),
      },
    };
  }
  return {};
}

module.exports = router;
module.exports.buildSendOpts = buildSendOpts;
