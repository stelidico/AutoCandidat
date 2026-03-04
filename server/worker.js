const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { analyzeText } = require('./analysis');
const { generateCoverLetter } = require('./openai');
const { sendEmail } = require('./email');
const logger = require('./logger');
const { buildSendOpts } = require('./routes/api');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processCampaign(campaignId) {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
  if (!campaign) return;

  const account = campaign.account_id
    ? db.prepare('SELECT * FROM email_accounts WHERE id = ?').get(campaign.account_id)
    : null;

  // Safety: account must belong to same user as campaign
  if (account && account.user_id !== campaign.user_id) {
    logger.error('Account does not belong to campaign owner', { campaignId });
    db.prepare("UPDATE campaigns SET status = 'failed', completed_at = unixepoch() WHERE id = ?").run(campaignId);
    return;
  }

  const targets = JSON.parse(campaign.targets || '[]');
  const results = [];

  // Fetch candidate identity for the From header
  const owner = db.prepare('SELECT name, sender_email, email FROM users WHERE id = ?').get(campaign.user_id);
  const ownerName = owner?.name || '';
  // sender_email is the address the candidate registered for sending applications
  // Falls back to the OAuth/SMTP account address if not set
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

    // Persist after each target so progress survives a crash
    db.prepare('UPDATE campaigns SET results = ? WHERE id = ?').run(JSON.stringify(results), campaignId);
  }

  db.prepare("UPDATE campaigns SET status = 'completed', completed_at = unixepoch(), results = ? WHERE id = ?")
    .run(JSON.stringify(results), campaignId);

  const ok = results.filter((r) => r.ok).length;
  logger.info('Campaign completed', { campaignId, total: targets.length, ok });
}

async function processJob(job) {
  try {
    if (job.type === 'campaign_start') {
      const { campaignId } = JSON.parse(job.payload || '{}');
      if (campaignId) await processCampaign(campaignId);
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

function startWorker() {
  // Re-queue any campaigns that were left in 'running' state (server restart recovery)
  const stuck = db.prepare("SELECT id FROM campaigns WHERE status = 'running'").all();
  for (const c of stuck) {
    db.prepare("UPDATE campaigns SET status = 'queued' WHERE id = ?").run(c.id);
    db.prepare('INSERT INTO jobs (id, type, payload) VALUES (?, ?, ?)')
      .run(uuidv4(), 'campaign_start', JSON.stringify({ campaignId: c.id }));
    logger.warn('Re-queued stuck campaign', { campaignId: c.id });
  }

  async function run() {
    logger.info('Worker started, polling queue...');
    while (true) {
      try {
        // Atomic dequeue — UPDATE+RETURNING prevents double-processing
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
      } catch (err) {
        logger.error('Worker loop error', { err: err.message });
        await sleep(5000);
      }
    }
  }

  // Non-blocking — runs alongside Express in the same event loop
  run().catch((err) => logger.error('Worker fatal error', { err: err.message }));
}

module.exports = { startWorker };
