const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(dataDir, 'autocandidat.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    email        TEXT NOT NULL UNIQUE,
    password     TEXT NOT NULL,
    name         TEXT NOT NULL DEFAULT '',
    sender_email TEXT NOT NULL DEFAULT '',
    created_at   INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS email_accounts (
    id                   TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider             TEXT NOT NULL,
    label                TEXT NOT NULL DEFAULT '',
    email_address        TEXT NOT NULL,
    oauth_access_token   TEXT,
    oauth_refresh_token  TEXT,
    oauth_expiry         INTEGER,
    smtp_host            TEXT,
    smtp_port            INTEGER,
    smtp_secure          INTEGER,
    smtp_user            TEXT,
    smtp_pass            TEXT,
    created_at           INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_ea_user_email ON email_accounts(user_id, email_address);
  CREATE INDEX IF NOT EXISTS idx_ea_user_id ON email_accounts(user_id);

  CREATE TABLE IF NOT EXISTS campaigns (
    id                       TEXT PRIMARY KEY,
    user_id                  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id               TEXT REFERENCES email_accounts(id) ON DELETE SET NULL,
    name                     TEXT NOT NULL,
    status                   TEXT NOT NULL DEFAULT 'draft',
    email_subject            TEXT NOT NULL DEFAULT '',
    email_footer             TEXT NOT NULL DEFAULT '',
    cv_text                  TEXT NOT NULL DEFAULT '',
    job_description_template TEXT NOT NULL DEFAULT '',
    targets                  TEXT NOT NULL DEFAULT '[]',
    results                  TEXT NOT NULL DEFAULT '[]',
    created_at               INTEGER NOT NULL DEFAULT (unixepoch()),
    started_at               INTEGER,
    completed_at             INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
  CREATE INDEX IF NOT EXISTS idx_campaigns_status  ON campaigns(status);

  CREATE TABLE IF NOT EXISTS jobs (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL,
    payload     TEXT NOT NULL DEFAULT '{}',
    status      TEXT NOT NULL DEFAULT 'pending',
    error       TEXT,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    started_at  INTEGER,
    done_at     INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
`);

// ─── Applications (ATS) ───────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company       TEXT NOT NULL DEFAULT '',
    job_title     TEXT NOT NULL DEFAULT '',
    offer_url     TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'draft',
    applied_at    INTEGER,
    notes         TEXT NOT NULL DEFAULT '',
    salary        TEXT NOT NULL DEFAULT '',
    location      TEXT NOT NULL DEFAULT '',
    contact_name  TEXT NOT NULL DEFAULT '',
    contact_email TEXT NOT NULL DEFAULT '',
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
  CREATE INDEX IF NOT EXISTS idx_applications_status  ON applications(status);
`);

// Migrations for existing databases
const migrations = [
  "ALTER TABLE users ADD COLUMN sender_email TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'",
  "ALTER TABLE users ADD COLUMN applications_bonus INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN letters_this_month INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN letters_reset_at INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN premium_until INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT",
  "ALTER TABLE applications ADD COLUMN source TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE applications ADD COLUMN email_used TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE applications ADD COLUMN tracking_id TEXT",
  "ALTER TABLE applications ADD COLUMN email_opened_at INTEGER",
  "DELETE FROM testimonials WHERE source = 'seeded'",
  "ALTER TABLE page_views ADD COLUMN city TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE page_views ADD COLUMN country TEXT NOT NULL DEFAULT ''",
  "CREATE INDEX IF NOT EXISTS idx_page_views_city ON page_views(city)",
  "ALTER TABLE applications ADD COLUMN follow_up_sent_at INTEGER",
];
for (const sql of migrations) {
  try { db.exec(sql); } catch (_) {}
}

// ─── Admin & Monitoring tables ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS testimonials (
    id         TEXT PRIMARY KEY,
    user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
    name       TEXT NOT NULL DEFAULT '',
    role       TEXT NOT NULL DEFAULT '',
    avatar     TEXT NOT NULL DEFAULT '',
    text       TEXT NOT NULL DEFAULT '',
    stars      INTEGER NOT NULL DEFAULT 5,
    date       TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL DEFAULT 'pending',
    source     TEXT NOT NULL DEFAULT 'user',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);

  CREATE TABLE IF NOT EXISTS admin_audit_log (
    id          TEXT PRIMARY KEY,
    admin_id    TEXT NOT NULL REFERENCES users(id),
    action      TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT '',
    target_id   TEXT NOT NULL DEFAULT '',
    detail      TEXT NOT NULL DEFAULT '{}',
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at);

  CREATE TABLE IF NOT EXISTS ai_usage (
    id            TEXT PRIMARY KEY,
    user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
    action        TEXT NOT NULL DEFAULT '',
    model         TEXT NOT NULL DEFAULT '',
    input_tokens  INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage(created_at);

  CREATE TABLE IF NOT EXISTS smtp_log (
    id          TEXT PRIMARY KEY,
    user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
    to_email    TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'ok',
    error       TEXT,
    provider    TEXT NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_smtp_log_created ON smtp_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_smtp_log_status  ON smtp_log(status);

  CREATE TABLE IF NOT EXISTS page_views (
    id         TEXT PRIMARY KEY,
    path       TEXT NOT NULL DEFAULT '/',
    referrer   TEXT NOT NULL DEFAULT '',
    city       TEXT NOT NULL DEFAULT '',
    country    TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
  CREATE INDEX IF NOT EXISTS idx_page_views_path    ON page_views(path);
`);


// ─── Promo codes ──────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS promo_codes (
    code       TEXT PRIMARY KEY,
    credits    INTEGER NOT NULL DEFAULT 0,
    max_uses   INTEGER NOT NULL DEFAULT 0,
    used_count INTEGER NOT NULL DEFAULT 0,
    active     INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS promo_redemptions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code       TEXT NOT NULL REFERENCES promo_codes(code),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, code)
  );
`);
// Seed code Auto5 (insert only if not exists)
db.prepare(`
  INSERT INTO promo_codes (code, credits, max_uses, used_count, active)
  VALUES ('AUTO5', 20, 10, 0, 1)
  ON CONFLICT(code) DO UPDATE SET credits = 20
`).run();

// ─── Settings table ───────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );
`);
const defaultSettings = [
  ['legal_address', ''],
];
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of defaultSettings) insertSetting.run(key, value);


module.exports = db;
