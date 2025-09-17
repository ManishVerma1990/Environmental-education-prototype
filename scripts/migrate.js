const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_init.sql'), 'utf8');
db.exec(sql);
console.log('Applied 001_init.sql to ecolearn.db');
