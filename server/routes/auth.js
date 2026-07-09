const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  generateAuthUrl,
  exchangeCode,
  makeOAuthState,
  makeRegisterState,
  verifyOAuthState,
  decodeIdToken,
} = require('../auth/google');

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
const requireAuth = require('../middleware/auth');
const db = require('../db');
const { encrypt } = require('../crypto');
const logger = require('../logger');

// GET /auth/google/url — requires a valid JWT (user must be logged in)
router.get('/google/url', requireAuth, (req, res) => {
  const state = makeOAuthState(req.user.id);
  const url = generateAuthUrl(state);
  res.json({ url });
});

// GET /auth/google/url/register — no auth required (used during registration)
router.get('/google/url/register', (_req, res) => {
  const state = makeRegisterState();
  const url = generateAuthUrl(state);
  res.json({ url });
});

// GET /auth/google/callback — Google redirects here with ?code=...&state=...
router.get('/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Code manquant');

    // Decode state to check if this is a registration or a connect
    let userId = null;
    let isRegister = false;
    try {
      const payload = JSON.parse(Buffer.from((state || '').split('.')[0], 'base64url').toString());
      if (payload.register) isRegister = true;
      else userId = verifyOAuthState(state);
    } catch {
      return res.redirect(`${frontendUrl}/oauth-callback?gmail_error=${encodeURIComponent('State invalide')}`);
    }

    const tokens = await exchangeCode(code);
    const idPayload = decodeIdToken(tokens.id_token);
    const emailAddress = idPayload?.email;
    const googleName = idPayload?.name || (emailAddress ? emailAddress.split('@')[0] : 'Utilisateur');

    if (!emailAddress) {
      return res.redirect(`${frontendUrl}/oauth-callback?gmail_error=${encodeURIComponent("Email introuvable depuis Google")}`);
    }

    // ── Registration flow ──────────────────────────────────────────────────────
    if (isRegister) {
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailAddress.toLowerCase());
      if (!user) {
        const id = uuidv4();
        const hash = await bcrypt.hash(uuidv4(), 12);
        db.prepare('INSERT INTO users (id, email, password, name, sender_email, applications_bonus) VALUES (?, ?, ?, ?, ?, 10)')
          .run(id, emailAddress.toLowerCase(), hash, googleName, emailAddress.toLowerCase());
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      }
      userId = user.id;

      // Store Gmail OAuth tokens
      const existing = db.prepare('SELECT id FROM email_accounts WHERE user_id = ? AND email_address = ?').get(userId, emailAddress);
      if (existing) {
        db.prepare('UPDATE email_accounts SET oauth_access_token=?, oauth_refresh_token=COALESCE(?,oauth_refresh_token), oauth_expiry=? WHERE id=?')
          .run(encrypt(tokens.access_token), tokens.refresh_token ? encrypt(tokens.refresh_token) : null, tokens.expiry_date || null, existing.id);
      } else {
        db.prepare('INSERT INTO email_accounts (id,user_id,provider,label,email_address,oauth_access_token,oauth_refresh_token,oauth_expiry) VALUES (?,?,\'gmail\',?,?,?,?,?)')
          .run(uuidv4(), userId, emailAddress, emailAddress, encrypt(tokens.access_token), tokens.refresh_token ? encrypt(tokens.refresh_token) : null, tokens.expiry_date || null);
      }

      res.cookie('token', signToken(user), COOKIE_OPTS);
      logger.info('Gmail register success', { userId, emailAddress });
      return res.redirect(`${frontendUrl}/oauth-callback?gmail_connected=1`);
    }

    // ── Connect flow (existing user) ───────────────────────────────────────────
    const existing = db.prepare('SELECT id FROM email_accounts WHERE user_id = ? AND email_address = ?').get(userId, emailAddress);
    let accountId;
    if (existing) {
      accountId = existing.id;
      db.prepare('UPDATE email_accounts SET oauth_access_token=?, oauth_refresh_token=COALESCE(?,oauth_refresh_token), oauth_expiry=? WHERE id=?')
        .run(encrypt(tokens.access_token), tokens.refresh_token ? encrypt(tokens.refresh_token) : null, tokens.expiry_date || null, accountId);
    } else {
      accountId = uuidv4();
      db.prepare('INSERT INTO email_accounts (id,user_id,provider,label,email_address,oauth_access_token,oauth_refresh_token,oauth_expiry) VALUES (?,?,\'gmail\',?,?,?,?,?)')
        .run(accountId, userId, emailAddress, emailAddress, encrypt(tokens.access_token), tokens.refresh_token ? encrypt(tokens.refresh_token) : null, tokens.expiry_date || null);
    }

    logger.info('Gmail OAuth connect success', { userId, emailAddress, accountId });
    res.redirect(`${frontendUrl}/oauth-callback?gmail_connected=1`);
  } catch (err) {
    logger.error('OAuth callback error', { err: err.message });
    res.redirect(`${frontendUrl}/oauth-callback?gmail_error=${encodeURIComponent(err.message)}`);
  }
});

module.exports = router;
