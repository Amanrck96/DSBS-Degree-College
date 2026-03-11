const serverless = require('serverless-http');
const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('../database');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Memory storage for Vercel serverless environment since it's read-only
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ===== FRONTEND ROUTES =====
const pages = [
    'index', 'about-us', 'history', 'vision-mission', 'management', 'governing-body',
    'principal-message', 'college-profile', 'courses', 'departments', 'facilities',
    'library', 'laboratories', 'admissions', 'academic-calendar', 'events', 'contact-us'
];

pages.forEach(page => {
    app.get(page === 'index' ? '/' : `/${page}`, (req, res) => {
        let title = page.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (title === 'About Us') title = 'About Us';
        if (title === 'Contact Us') title = 'Contact Us';

        if (page === 'index') {
            db.all('SELECT * FROM notices ORDER BY date DESC LIMIT 5', (err, notices) => {
                db.all('SELECT * FROM gallery ORDER BY date DESC LIMIT 6', (err2, gallery) => {
                    res.render('index', { page: 'Home', notices: notices || [], gallery: gallery || [] });
                });
            });
        } else if (['contact-us'].includes(page)) {
            res.render('contact', { page: title });
        } else if (['courses', 'departments'].includes(page)) {
            res.render(page, { page: title });
        } else {
            res.render('generic', { page: title });
        }
    });
});

app.get('/gallery', (req, res) => {
    db.all('SELECT * FROM gallery ORDER BY date DESC', (err, gallery) => {
        res.render('gallery', { page: 'Gallery', gallery: gallery || [] });
    });
});

app.get('/notice-board', (req, res) => {
    db.all('SELECT * FROM notices ORDER BY date DESC', (err, notices) => {
        res.render('notice-board', { page: 'Notice Board', notices: notices || [] });
    });
});

// ===== ADMIN ROUTES =====
app.get('/admin', (req, res) => {
    res.render('admin/dashboard', { page: 'Admin Dashboard' });
});

// Note: File uploads in Vercel Serverless require external storage like S3, Cloudinary, etc.
// For now, this just stores the data in SQLite without saving a file locally, since Vercel is read-only.
app.post('/admin/upload-notice', upload.single('document'), (req, res) => {
    const { title, description } = req.body;
    let file_url = null; // No local file saving in Serverless
    const date = new Date().toISOString();

    db.run(`INSERT INTO notices (title, description, file_url, date) VALUES (?, ?, ?, ?)`,
        [title, description, file_url, date], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.redirect('/admin');
        });
});

app.post('/admin/upload-gallery', upload.single('image'), (req, res) => {
    const { title, category } = req.body;
    let image_url = 'https://via.placeholder.com/800x400'; // No local file saving in Serverless
    const date = new Date().toISOString();

    db.run(`INSERT INTO gallery (title, image_url, category, date) VALUES (?, ?, ?, ?)`,
        [title, image_url, category, date], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.redirect('/admin');
        });
});

module.exports = app;
module.exports.handler = serverless(app);
