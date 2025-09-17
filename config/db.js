// config/db.js
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'ecolearn.db');   // <-- fixed, absolute path
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

module.exports = db;
