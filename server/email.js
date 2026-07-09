require('dotenv').config();
const nodemailer = require('nodemailer');

function createTransportFromOptions(opts = {}) {
  // opts.smtp: { host, port, secure, user, pass }
  // opts.oauth: { type: 'oauth2', user, clientId, clientSecret, refreshToken, accessToken }
  if (opts.smtp && opts.smtp.host) {
    const s = opts.smtp;
    return nodemailer.createTransport({
      host: s.host,
      port: s.port ? parseInt(s.port, 10) : 587,
      secure: s.secure === true || s.secure === 'true',
      auth: s.user ? { user: s.user, pass: s.pass } : undefined
    });
  }

  if (opts.oauth && opts.oauth.type === 'oauth2' && opts.oauth.user) {
    const o = opts.oauth;
    const clientId = o.clientId || process.env.GMAIL_CLIENT_ID;
    const clientSecret = o.clientSecret || process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = o.refreshToken;
    const accessToken = o.accessToken;
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: o.user,
        clientId,
        clientSecret,
        refreshToken,
        accessToken
      }
    });
  }

  // Fallback to environment SMTP
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

/**
 * sendEmail options:
 * - to, subject, text, html, from
 * - smtp: optional per-request SMTP config
 * - oauth: optional per-request OAuth2 config for Gmail
 */
async function sendEmail({ to, subject, text, html, from, smtp, oauth, attachments }) {
  const transport = createTransportFromOptions({ smtp, oauth });
  if (!transport) throw new Error('No SMTP/OAuth configuration provided (set SMTP_HOST env or provide smtp/oauth options).');
  const info = await transport.sendMail({ from, to, subject, text, html, attachments });
  return info;
}

module.exports = { sendEmail };
