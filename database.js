const sqlite3 = require('sqlite3').verbose();
const path = require('path');

if (process.env.VERCEL) {
    // Vercel Serverless environments frequently crash with sqlite3 native C++ bindings
    // due to read-only architectures and missing .node binaries. Using mock layer for cloud.
    console.log('Using in-memory mock DB for Vercel environment.');
    const mockDb = {
        notices: [],
        gallery: []
    };
    module.exports = {
        run: (query, params, cb) => {
            if (typeof params === 'function') cb = params;
            if (cb) cb(null);
        },
        all: (query, params, cb) => {
            if (typeof params === 'function') cb = params;
            if (query.includes('notices')) cb(null, mockDb.notices);
            else if (query.includes('gallery')) cb(null, mockDb.gallery);
            else cb(null, []);
        }
    };
} else {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.resolve(__dirname, 'college.db');
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('Error opening database', err.message);
        else {
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
}
