const crypto = require('crypto');

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const PREFIX = 'enc:';

function getKey() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-dev-key-change-me';
  return crypto.createHash('sha256').update(secret).digest(); // 32 bytes
}

/**
 * Encrypt a plaintext string. Returns a prefixed ciphertext string.
 * Safe to call on already-encrypted values (idempotent).
 */
function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  if (String(plaintext).startsWith(PREFIX)) return plaintext; // already encrypted
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return PREFIX + [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

/**
 * Decrypt a ciphertext string produced by encrypt().
 * Returns the original plaintext. Falls back to returning the value as-is
 * for legacy plaintext values (backward compatible).
 */
function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext;
  if (!String(ciphertext).startsWith(PREFIX)) return ciphertext; // plaintext legacy value
  try {
    const key = getKey();
    const parts = String(ciphertext).slice(PREFIX.length).split(':');
    if (parts.length !== 3) return ciphertext;
    const [ivHex, authTagHex, encHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encBuf = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encBuf), decipher.final()]).toString('utf8');
  } catch {
    return ciphertext; // decryption failed, return as-is
  }
}

module.exports = { encrypt, decrypt };
