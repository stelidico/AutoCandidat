const { google } = require('googleapis');
const crypto = require('crypto');
require('dotenv').config();

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const REDIRECT_URI =
  process.env.GMAIL_OAUTH_REDIRECT ||
  (process.env.BASE_URL
    ? `${process.env.BASE_URL}/auth/google/callback`
    : 'http://localhost:4000/auth/google/callback');

function createOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

function generateAuthUrl(state) {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'openid',
      'email',
      'profile',
    ],
    state: state || '',
  });
}

async function exchangeCode(code) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// ─── Signed OAuth state (HMAC-SHA256) ─────────────────────────────────────────
function makeOAuthState(userId) {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'fallback')
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyOAuthState(state) {
  const parts = (state || '').split('.');
  if (parts.length !== 2) throw new Error('Format state invalide');
  const [payload, sig] = parts;

  const expected = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'fallback')
    .update(payload)
    .digest('base64url');

  // timingSafeEqual requires same-length buffers
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    throw new Error('Signature state invalide');
  }

  const { userId, iat } = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (Date.now() - iat > 10 * 60 * 1000) throw new Error('State expiré (10 min max)');
  return userId;
}

// Decode the Google id_token payload (exchange proves authenticity, no need to verify sig)
function decodeIdToken(idToken) {
  if (!idToken) return null;
  try {
    const [, payloadB64] = idToken.split('.');
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  } catch {
    return null;
  }
}

module.exports = {
  generateAuthUrl,
  exchangeCode,
  makeOAuthState,
  verifyOAuthState,
  decodeIdToken,
  REDIRECT_URI,
};
