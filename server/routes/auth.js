const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const {
  generateAuthUrl,
  exchangeCode,
  makeOAuthState,
  verifyOAuthState,
  decodeIdToken,
} = require('../auth/google');
const requireAuth = require('../middleware/auth');
const db = require('../db');
const logger = require('../logger');

// GET /auth/google/url — requires a valid JWT (user must be logged in)
router.get('/google/url', requireAuth, (req, res) => {
  const state = makeOAuthState(req.user.id);
  const url = generateAuthUrl(state);
  res.json({ url });
});

// GET /auth/google/callback — Google redirects here with ?code=...&state=...
router.get('/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Code manquant');

    const userId = verifyOAuthState(state);
    const tokens = await exchangeCode(code);

    const idPayload = decodeIdToken(tokens.id_token);
    const emailAddress = idPayload && idPayload.email;
    if (!emailAddress) {
      logger.error('OAuth callback: email missing from id_token');
      return res.status(400).send("Impossible de récupérer l'email depuis Google");
    }

    // Upsert — keep existing refresh_token if Google didn't send a new one
    const existing = db
      .prepare('SELECT id FROM email_accounts WHERE user_id = ? AND email_address = ?')
      .get(userId, emailAddress);

    let accountId;
    if (existing) {
      accountId = existing.id;
      db.prepare(`
        UPDATE email_accounts SET
          oauth_access_token = ?,
          oauth_refresh_token = COALESCE(?, oauth_refresh_token),
          oauth_expiry = ?
        WHERE id = ?
      `).run(tokens.access_token, tokens.refresh_token || null, tokens.expiry_date || null, accountId);
    } else {
      accountId = uuidv4();
      db.prepare(`
        INSERT INTO email_accounts
          (id, user_id, provider, label, email_address, oauth_access_token, oauth_refresh_token, oauth_expiry)
        VALUES (?, ?, 'gmail', ?, ?, ?, ?, ?)
      `).run(
        accountId, userId, emailAddress, emailAddress,
        tokens.access_token, tokens.refresh_token || null, tokens.expiry_date || null
      );
    }

    logger.info('Gmail OAuth success', { userId, emailAddress, accountId });

    // Post back only the accountId — NEVER raw tokens
    const safeId = JSON.stringify(accountId);
    const safeOrigin = JSON.stringify(frontendUrl);
    res.send(`<!doctype html><html><body><script>
      try {
        if (window.opener) {
          window.opener.postMessage({ type: 'gmail_oauth_success', accountId: ${safeId} }, ${safeOrigin});
        }
      } catch(e) {}
      document.write('<p>Authentification réussie. Fermeture en cours...</p>');
      setTimeout(function(){ window.close(); }, 1500);
    </script></body></html>`);
  } catch (err) {
    logger.error('OAuth callback error', { err: err.message });
    const safeOrigin = JSON.stringify(frontendUrl);
    const safeErr = JSON.stringify(err.message);
    res.status(400).send(`<!doctype html><html><body><script>
      try {
        if (window.opener) {
          window.opener.postMessage({ type: 'gmail_oauth_error', error: ${safeErr} }, ${safeOrigin});
        }
      } catch(e) {}
      document.write('<p>Erreur: ${err.message.replace(/'/g, "\\'")}. Fermez cette fenêtre.</p>');
      setTimeout(function(){ window.close(); }, 3000);
    </script></body></html>`);
  }
});

module.exports = router;
