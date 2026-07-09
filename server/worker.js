const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { analyzeText } = require('./analysis');
const { generateCoverLetter } = require('./openai');
const { sendEmail } = require('./email');
const logger = require('./logger');
const { buildSendOpts } = require('./routes/api');

// ─── DNS MX verification ──────────────────────────────────────────────────────
const mxCache = new Map(); // domain → true/false (cache 1h)

async function hasMxRecord(domain) {
  if (mxCache.has(domain)) return mxCache.get(domain);
  try {
    const records = await dns.resolveMx(domain);
    const valid = Array.isArray(records) && records.length > 0;
    mxCache.set(domain, valid);
    setTimeout(() => mxCache.delete(domain), 3600 * 1000);
    return valid;
  } catch {
    mxCache.set(domain, false);
    setTimeout(() => mxCache.delete(domain), 3600 * 1000);
    return false;
  }
}

const CV_STORAGE_DIR = path.join(__dirname, 'data', 'cv_files');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Helpers auto-apply ───────────────────────────────────────────────────────

/**
 * Dérive un domaine email à partir d'une offre.
 * Priorité : URL d'origine de l'offre → nom d'entreprise sanitisé.
 */
function deriveCompanyDomain({ company, companyWebsite }) {
  if (companyWebsite) {
    try {
      const url = new URL(companyWebsite);
      const host = url.hostname.replace(/^www\./, '');
      const excluded = ['francetravail', 'pole-emploi', 'indeed', 'linkedin', 'meteojob', 'monster', 'apec', 'jobteaser', 'hellowork'];
      if (host && !excluded.some((s) => host.includes(s))) return host;
    } catch {}
  }
  if (!company || company === 'Entreprise non précisée') return null;
  const domain = company
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/\s+(s\.?a\.?s?\.?|s\.?a\.?r?l\.?|eurl|sas|sa|sarl|spa|plc|ltd|inc|corp|group[e]?|france|paris|lyon|marseille|bordeaux|toulouse|holding|services?|consulting)\s*$/gi, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 30);
  return domain ? `${domain}.fr` : null;
}

/**
 * Personnalise la lettre avec le nom d'entreprise et l'intitulé du poste.
 * Injecte une phrase après la salutation si trouvée.
 */
function personalizeLetterForCompany(letter, company, title) {
  const intro = `Je me permets de vous adresser ma candidature pour le poste de ${title} au sein de ${company}. `;
  // Try to inject after salutation line
  const salutRegex = /(Madame[\s,]|Monsieur[\s,]|Madame,\s*Monsieur[\s,]|Bonjour[\s,])/i;
  if (salutRegex.test(letter)) {
    return letter.replace(salutRegex, (match) => match + '\n\n' + intro);
  }
  return intro + '\n\n' + letter;
}

/**
 * Envoie un email via l'API Resend (fallback si pas de compte email configuré).
 * Nécessite RESEND_API_KEY et RESEND_FROM dans les variables d'env.
 */
async function sendViaResend({ from, to, subject, text, attachments = [] }) {
  const resendAttachments = attachments.map((a) => ({
    filename: a.filename,
    content: fs.readFileSync(a.path).toString('base64'),
  }));

  const body = { from, to: [to], subject, text };
  if (resendAttachments.length > 0) body.attachments = resendAttachments;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Resend HTTP ${response.status}`);
  }
  return response.json();
}

// ─── Process auto_apply_emails job ───────────────────────────────────────────

async function processAutoApplyEmails({ userId, items, letter, cvFileId }) {
  if (!Array.isArray(items) || items.length === 0) return;

  const user = db.prepare('SELECT name, sender_email, email, plan FROM users WHERE id = ?').get(userId);
  const isPremiumPlan = user?.plan === 'premium';

  const insertApp = db.prepare(`
    INSERT INTO applications
      (id, user_id, company, job_title, offer_url, status, location, applied_at, notes, source, email_used, contact_email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?, '', ?, ?, ?)
  `);
  // Préférer Gmail OAuth sur SMTP, puis le plus récent
  const emailAccount = db.prepare(`
    SELECT * FROM email_accounts
    WHERE user_id = ?
    ORDER BY
      CASE WHEN provider = 'gmail' AND oauth_refresh_token IS NOT NULL THEN 0 ELSE 1 END,
      created_at DESC
    LIMIT 1
  `).get(userId);

  const hasResend = !!process.env.RESEND_API_KEY;

  if (!emailAccount && !hasResend) {
    logger.warn('Auto-apply emails skipped: no email provider configured', { userId });
    return;
  }

  const fromName = user?.name || '';
  const fromAddr = user?.sender_email || user?.email || emailAccount?.email_address || '';
  const from = emailAccount
    ? (fromName ? `"${fromName}" <${fromAddr}>` : fromAddr)
    : (process.env.RESEND_FROM || `candidatures@autocandidat.fr`);

  // Build PDF attachment once for all emails
  const attachments = [];
  if (cvFileId) {
    const cvPath = path.join(CV_STORAGE_DIR, `${cvFileId}.pdf`);
    if (fs.existsSync(cvPath)) {
      attachments.push({ filename: 'CV.pdf', path: cvPath, contentType: 'application/pdf' });
    }
  }

  const baseUrl = process.env.BASE_URL || 'https://autocandidat-api-production.up.railway.app';
  const nowTs = Math.floor(Date.now() / 1000);
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const { appId, company, title, companyWebsite, contactEmail, offerUrl, location, source, sector: itemSector } = items[i];
    try {
      let toEmail = '';

      // Priorité 1 : email de contact extrait directement de l'offre (France Travail)
      if (contactEmail && /^[^@]+@[^@]+\.[^@]+$/.test(contactEmail)) {
        toEmail = contactEmail;
        logger.info('Using verified contact email from offer', { company, toEmail });
      } else {
        const domain = deriveCompanyDomain({ company, companyWebsite });
        if (!domain) {
          // Pas d'email trouvable → on skip sans créer d'entrée ATS ni déduire de crédit
          logger.warn('No email domain derived, skipping', { company });
          results.push({ company, title, ok: false, reason: 'Adresse email introuvable' });
          continue;
        }

        // Priorité 2 : vérification MX
        const mxValid = await hasMxRecord(domain);
        if (!mxValid) {
          logger.warn('No MX record for domain, skipping', { company, domain });
          results.push({ company, title, ok: false, reason: `Domaine ${domain} sans serveur mail` });
          continue;
        }
        toEmail = `rh@${domain}`;
      }

      const personalizedLetter = personalizeLetterForCompany(letter, company, title);
      const subject = `Candidature – ${title} chez ${company}`;

      // Tracking pixel — forfait 49,99€ uniquement
      let htmlBody = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap">${personalizedLetter.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`;
      let trackingId = null;
      if (isPremiumPlan) {
        trackingId = uuidv4();
        const pixel = `<img src="${baseUrl}/track/open/${trackingId}" width="1" height="1" style="display:none" alt="" />`;
        htmlBody += pixel;
      }

      if (emailAccount) {
        const sendOpts = buildSendOpts(emailAccount);
        await sendEmail({ from, to: toEmail, subject, text: personalizedLetter, html: htmlBody, attachments, ...sendOpts });
      } else {
        await sendViaResend({ from, to: toEmail, subject, text: personalizedLetter, attachments });
      }

      // ✅ Envoi réussi → créer l'entrée ATS + déduire 1 crédit
      const noteText = source === 'France Travail'
        ? `Réponse à une offre France Travail — ${itemSector || ''}`
        : source === 'Adzuna'
        ? `Réponse à une offre Adzuna — ${itemSector || ''}`
        : source === 'Jooble'
        ? `Réponse à une offre Jooble — ${itemSector || ''}`
        : `Candidature — ${itemSector || ''}`;

      db.transaction(() => {
        insertApp.run(appId, userId, company, title, offerUrl || '', location || '', nowTs, noteText, source || '', toEmail, contactEmail || '', nowTs, nowTs);
        if (trackingId) {
          db.prepare('UPDATE applications SET tracking_id = ? WHERE id = ?').run(trackingId, appId);
        }
        // Crédits déjà déduits en totalité au lancement dans routes/jobs.js
      })();

      logger.info('Auto-apply email sent', { to: toEmail, company });
      results.push({ company, title, ok: true, to: toEmail });
    } catch (err) {
      // Echec SMTP → on skip sans créer d'entrée ATS ni déduire de crédit
      logger.error('Auto-apply single email failed', { appId, company, err: err.message });
      results.push({ company, title, ok: false, reason: err.message });
    }

    // Anti-spam : 2.5s entre chaque envoi
    if (i < items.length - 1) await sleep(2500);
  }

  logger.info('Auto-apply emails batch done', { userId, total: items.length });

  // ── Notification récapitulative — forfait 49,99€ uniquement ───────────────
  if (!isPremiumPlan) return;
  try {
    const userEmail = user?.email;
    const userName = user?.name || 'Candidat';
    if (userEmail) {
      const sent = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);
      const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

      const sentRows = sent.map((r) => `  ✅ ${r.title} chez ${r.company} → ${r.to}`).join('\n');
      const failedRows = failed.map((r) => `  ❌ ${r.title} chez ${r.company} (${r.reason})`).join('\n');

      const textBody = [
        `Bonjour ${userName},`,
        ``,
        `Voici le récapitulatif de vos candidatures envoyées le ${date} :`,
        ``,
        sent.length > 0 ? `${sent.length} candidature(s) envoyée(s) avec succès :\n${sentRows}` : null,
        failed.length > 0 ? `\n${failed.length} candidature(s) en échec :\n${failedRows}` : null,
        ``,
        `Retrouvez le suivi complet de vos candidatures sur votre tableau de bord.`,
        ``,
        `Bonne chance !`,
        `L'équipe Autocandidat`,
      ].filter((l) => l !== null).join('\n');

      const sentHtml = sent.map((r) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">✅</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0"><strong>${r.title}</strong> chez ${r.company}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280">${r.to}</td></tr>`
      ).join('');
      const failedHtml = failed.map((r) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">❌</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0"><strong>${r.title}</strong> chez ${r.company}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;color:#ef4444">${r.reason}</td></tr>`
      ).join('');

      const htmlBody = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
          <div style="background:#4f46e5;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0;font-size:20px">Récapitulatif de vos candidatures</h1>
            <p style="color:#c7d2fe;margin:4px 0 0;font-size:14px">${date}</p>
          </div>
          <div style="background:#f9fafb;padding:24px 32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
            <p style="margin:0 0 16px">Bonjour <strong>${userName}</strong>,</p>
            <p style="margin:0 0 20px">Voici le récapitulatif de vos candidatures envoyées aujourd'hui :</p>
            ${sent.length > 0 ? `
              <p style="font-weight:600;color:#059669;margin:0 0 8px">✅ ${sent.length} candidature(s) envoyée(s)</p>
              <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;margin-bottom:20px;font-size:14px">
                ${sentHtml}
              </table>` : ''}
            ${failed.length > 0 ? `
              <p style="font-weight:600;color:#dc2626;margin:0 0 8px">❌ ${failed.length} échec(s)</p>
              <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;margin-bottom:20px;font-size:14px">
                ${failedHtml}
              </table>` : ''}
            <p style="margin:20px 0 0;font-size:13px;color:#6b7280">Retrouvez le suivi complet sur votre <a href="${process.env.FRONTEND_URL || 'https://autocand-app.vercel.app'}" style="color:#4f46e5">tableau de bord</a>.</p>
          </div>
        </div>`;

      const notifFrom = process.env.RESEND_FROM || `noreply@autocandidat.fr`;
      if (hasResend) {
        await sendViaResend({ from: notifFrom, to: userEmail, subject: `📬 ${sent.length} candidature(s) envoyée(s) – ${date}`, text: textBody });
      } else if (emailAccount) {
        const sendOpts = buildSendOpts(emailAccount);
        await sendEmail({ from, to: userEmail, subject: `📬 ${sent.length} candidature(s) envoyée(s) – ${date}`, text: textBody, html: htmlBody, ...sendOpts });
      } else {
        await sendEmail({ from: notifFrom, to: userEmail, subject: `📬 ${sent.length} candidature(s) envoyée(s) – ${date}`, text: textBody, html: htmlBody });
      }
      logger.info('Notification email sent to user', { userEmail, sent: sent.length });
    }
  } catch (err) {
    logger.warn('Failed to send notification email to user', { err: err.message });
  }

  // RGPD : supprimer le fichier CV après envoi (ne plus le stocker inutilement)
  if (cvFileId) {
    const cvPath = path.join(CV_STORAGE_DIR, `${cvFileId}.pdf`);
    try { fs.unlinkSync(cvPath); } catch (_) {}
  }
}

// ─── Relance automatique après 7 jours ───────────────────────────────────────

async function processFollowUps() {
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;

  // Candidatures envoyées il y a 7+ jours, sans relance, avec email connu
  const dueApps = db.prepare(`
    SELECT a.id, a.user_id, a.company, a.job_title, a.email_used, a.applied_at
    FROM applications a
    JOIN users u ON u.id = a.user_id
    WHERE a.status = 'sent'
      AND a.applied_at IS NOT NULL
      AND a.applied_at <= ?
      AND (a.follow_up_sent_at IS NULL)
      AND a.email_used != ''
      AND a.email_opened_at IS NULL
      AND u.plan = 'premium'
  `).all(sevenDaysAgo);

  if (dueApps.length === 0) return;
  logger.info(`Follow-up: ${dueApps.length} application(s) eligible`);

  for (const app of dueApps) {
    try {
      const user = db.prepare('SELECT name, sender_email, email FROM users WHERE id = ?').get(app.user_id);
      if (!user) continue;

      const emailAccount = db.prepare(`
        SELECT * FROM email_accounts
        WHERE user_id = ?
        ORDER BY
          CASE WHEN provider = 'gmail' AND oauth_refresh_token IS NOT NULL THEN 0 ELSE 1 END,
          created_at DESC
        LIMIT 1
      `).get(app.user_id);

      const hasResend = !!process.env.RESEND_API_KEY;
      if (!emailAccount && !hasResend) continue;

      const fromName = user.name || '';
      const fromAddr = user.sender_email || user.email || emailAccount?.email_address || '';
      const from = emailAccount
        ? (fromName ? `"${fromName}" <${fromAddr}>` : fromAddr)
        : (process.env.RESEND_FROM || 'candidatures@autocandidat.fr');

      const appliedDate = new Date(app.applied_at * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

      const subject = `Relance – Candidature ${app.job_title} chez ${app.company}`;
      const textBody = [
        `Madame, Monsieur,`,
        ``,
        `Je me permets de vous relancer concernant ma candidature pour le poste de ${app.job_title} au sein de ${app.company}, que je vous ai adressée le ${appliedDate}.`,
        ``,
        `Je suis toujours très intéressé(e) par cette opportunité et serais ravi(e) de pouvoir échanger avec vous à ce sujet.`,
        ``,
        `Dans l'attente de votre retour, je reste à votre disposition.`,
        ``,
        `Cordialement,`,
        fromName || fromAddr,
      ].join('\n');

      const htmlBody = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#1f2937;white-space:pre-wrap">${textBody.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`;

      if (emailAccount) {
        const sendOpts = buildSendOpts(emailAccount);
        await sendEmail({ from, to: app.email_used, subject, text: textBody, html: htmlBody, ...sendOpts });
      } else {
        await sendViaResend({ from, to: app.email_used, subject, text: textBody });
      }

      const now = Math.floor(Date.now() / 1000);
      db.prepare('UPDATE applications SET follow_up_sent_at = ? WHERE id = ?').run(now, app.id);
      logger.info('Follow-up sent', { appId: app.id, company: app.company, to: app.email_used });
      await sleep(2500);
    } catch (err) {
      logger.warn('Follow-up send failed', { appId: app.id, err: err.message });
    }
  }
}

// ─── Process campaign job ─────────────────────────────────────────────────────

async function processCampaign(campaignId) {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
  if (!campaign) return;

  const account = campaign.account_id
    ? db.prepare('SELECT * FROM email_accounts WHERE id = ?').get(campaign.account_id)
    : null;

  if (account && account.user_id !== campaign.user_id) {
    logger.error('Account does not belong to campaign owner', { campaignId });
    db.prepare("UPDATE campaigns SET status = 'failed', completed_at = unixepoch() WHERE id = ?").run(campaignId);
    return;
  }

  const targets = JSON.parse(campaign.targets || '[]');
  const results = [];

  const owner = db.prepare('SELECT name, sender_email, email FROM users WHERE id = ?').get(campaign.user_id);
  const ownerName = owner?.name || '';
  const senderEmail = owner?.sender_email || owner?.email || (account ? account.email_address : '');

  db.prepare("UPDATE campaigns SET status = 'running', started_at = unixepoch() WHERE id = ?").run(campaignId);

  for (const target of targets) {
    try {
      const jobDesc = target.jobDescription || campaign.job_description_template || '';
      const cvText = target.cvText || campaign.cv_text || '';
      const analysis = cvText ? await analyzeText(cvText) : null;
      const letter = await generateCoverLetter({ cvText, jobDescription: jobDesc, analysis });

      const subject = campaign.email_subject || `Candidature - ${target.jobTitle || ''}`;
      const body = letter + (campaign.email_footer ? '\n\n' + campaign.email_footer : '');

      const sendOpts = account ? buildSendOpts(account) : {};
      const from = ownerName ? `"${ownerName}" <${senderEmail}>` : senderEmail;

      const info = await sendEmail({ from, to: target.email, subject, text: body, ...sendOpts });
      results.push({ target, ok: true, messageId: info.messageId, date: Date.now() });
      logger.info('Email sent', { to: target.email, campaignId });
    } catch (err) {
      results.push({ target, ok: false, error: err.message, date: Date.now() });
      logger.error('Email send failed', { to: target.email, campaignId, err: err.message });
    }

    db.prepare('UPDATE campaigns SET results = ? WHERE id = ?').run(JSON.stringify(results), campaignId);
  }

  db.prepare("UPDATE campaigns SET status = 'completed', completed_at = unixepoch(), results = ? WHERE id = ?")
    .run(JSON.stringify(results), campaignId);

  const ok = results.filter((r) => r.ok).length;
  logger.info('Campaign completed', { campaignId, total: targets.length, ok });
}

// ─── Job dispatcher ───────────────────────────────────────────────────────────

async function processJob(job) {
  try {
    if (job.type === 'campaign_start') {
      const { campaignId } = JSON.parse(job.payload || '{}');
      if (campaignId) await processCampaign(campaignId);
    } else if (job.type === 'auto_apply_emails') {
      const payload = JSON.parse(job.payload || '{}');
      await processAutoApplyEmails(payload);
    } else {
      logger.warn('Unknown job type', { type: job.type });
    }
    db.prepare("UPDATE jobs SET status = 'done', done_at = unixepoch() WHERE id = ?").run(job.id);
  } catch (err) {
    logger.error('Job processing failed', { jobId: job.id, err: err.message });
    db.prepare("UPDATE jobs SET status = 'failed', error = ?, done_at = unixepoch() WHERE id = ?")
      .run(err.message, job.id);
  }
}

// ─── Worker loop ──────────────────────────────────────────────────────────────

function startWorker() {
  // Re-queue campaigns bloquées en 'running' (recovery après crash)
  const stuckCampaigns = db.prepare("SELECT id FROM campaigns WHERE status = 'running'").all();
  for (const c of stuckCampaigns) {
    db.prepare("UPDATE campaigns SET status = 'queued' WHERE id = ?").run(c.id);
    db.prepare('INSERT INTO jobs (id, type, payload) VALUES (?, ?, ?)')
      .run(uuidv4(), 'campaign_start', JSON.stringify({ campaignId: c.id }));
    logger.warn('Re-queued stuck campaign', { campaignId: c.id });
  }

  // Re-queue jobs bloqués en 'processing' depuis plus de 10 minutes (crash worker)
  const stuckJobs = db.prepare(
    "SELECT id FROM jobs WHERE status = 'processing' AND started_at < unixepoch() - 600"
  ).all();
  for (const j of stuckJobs) {
    db.prepare("UPDATE jobs SET status = 'pending', started_at = NULL WHERE id = ?").run(j.id);
    logger.warn('Re-queued stuck job', { jobId: j.id });
  }

  let lastFollowUpCheck = 0;

  async function run() {
    logger.info('Worker started, polling queue...');
    while (true) {
      try {
        const job = db.prepare(`
          UPDATE jobs SET status = 'processing', started_at = unixepoch()
          WHERE id = (
            SELECT id FROM jobs WHERE status = 'pending'
            ORDER BY created_at ASC LIMIT 1
          )
          RETURNING *
        `).get();

        if (job) {
          logger.info('Processing job', { type: job.type, id: job.id });
          await processJob(job);
        } else {
          await sleep(3000);
        }

        // Vérifier les relances toutes les heures
        const now = Date.now();
        if (now - lastFollowUpCheck > 3600 * 1000) {
          lastFollowUpCheck = now;
          await processFollowUps().catch((err) =>
            logger.warn('Follow-up check failed', { err: err.message })
          );
        }
      } catch (err) {
        logger.error('Worker loop error', { err: err.message });
        await sleep(5000);
      }
    }
  }

  // Auto-restart if run() crashes fatally (should never happen due to inner try/catch)
  function launch() {
    run().catch((err) => {
      logger.error('Worker fatal error, restarting in 10s', { err: err.message });
      setTimeout(launch, 10000);
    });
  }
  launch();
}

module.exports = { startWorker };
