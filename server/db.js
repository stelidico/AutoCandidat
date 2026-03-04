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

// Migration for existing databases that don't have sender_email yet
try {
  db.exec("ALTER TABLE users ADD COLUMN sender_email TEXT NOT NULL DEFAULT ''");
} catch (_) {
  // Column already exists — ok
}

module.exports = db;
