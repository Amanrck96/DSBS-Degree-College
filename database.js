const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.VERCEL ? '/tmp/college.db' : path.resolve(__dirname, 'college.db');

if (process.env.VERCEL && !require('fs').existsSync(dbPath)) {
    try { require('fs').copyFileSync(path.resolve(__dirname, 'college.db'), dbPath); } catch (e) {}
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            file_url TEXT,
            date TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS gallery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            image_url TEXT NOT NULL,
            category TEXT,
            date TEXT NOT NULL
        )`);
    }
});

module.exports = db;
