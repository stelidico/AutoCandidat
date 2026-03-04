const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function readJSON(filename, defaultValue) {
  const p = path.join(dataDir, filename);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify(defaultValue || {} , null, 2));
    return defaultValue || {};
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return defaultValue || {};
  }
}

function writeJSON(filename, obj) {
  const p = path.join(dataDir, filename);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

module.exports = { readJSON, writeJSON, dataDir };
