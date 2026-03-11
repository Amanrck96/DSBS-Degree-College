const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// File Upload Configuration Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (req.path.includes('gallery')) {
            cb(null, './public/uploads/gallery/');
        } else if (req.path.includes('notice')) {
            cb(null, './public/uploads/notices/');
        } else {
            cb(null, './public/uploads/');
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ===== FRONTEND ROUTES =====
const pages = [
    'index', 'about', 'history', 'vision-mission', 'management', 'governing-body',
    'principal-message', 'college-profile', 'courses', 'departments', 'facilities',
    'library', 'laboratories', 'admissions', 'academic-calendar', 'events', 'contact'
];

pages.forEach(page => {
    app.get(page === 'index' ? '/' : `/${page}`, (req, res) => {
        if (page === 'index') {
            // Fetch some recent notices and gallery images for the home page
            db.all('SELECT * FROM notices ORDER BY date DESC LIMIT 5', (err, notices) => {
                db.all('SELECT * FROM gallery ORDER BY date DESC LIMIT 6', (err2, gallery) => {
                    res.render('index', { page: 'Home', notices: notices || [], gallery: gallery || [] });
                });
            });
        } else if (['contact', 'courses', 'departments'].includes(page)) {
            const title = page.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            res.render(page, { page: title });
        } else {
            const title = page.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

// Upload Notice
app.post('/admin/upload-notice', upload.single('document'), (req, res) => {
    const { title, description } = req.body;
    const file_url = req.file ? `/uploads/notices/${req.file.filename}` : null;
    const date = new Date().toISOString();

    db.run(`INSERT INTO notices (title, description, file_url, date) VALUES (?, ?, ?, ?)`,
        [title, description, file_url, date], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.redirect('/admin');
        });
});

// Upload Gallery
app.post('/admin/upload-gallery', upload.single('image'), (req, res) => {
    const { title, category } = req.body;
    const image_url = req.file ? `/uploads/gallery/${req.file.filename}` : null;
    const date = new Date().toISOString();

    if (!image_url) return res.status(400).send('Image is required');

    db.run(`INSERT INTO gallery (title, image_url, category, date) VALUES (?, ?, ?, ?)`,
        [title, image_url, category, date], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.redirect('/admin');
        });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
