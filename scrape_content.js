const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const originalUrl = 'https://dsbs.edu.in';
const pages = [
    { slug: 'about-us', url: '/guru-vishishta/about-us' },
    { slug: 'history', url: '/guru-vishishta/history' },
    { slug: 'vision-mission', url: '/guru-vishishta/vision-mission' },
    { slug: 'management', url: '/guru-vishishta/management' },
    { slug: 'governing-body', url: '/guru-vishishta/governing-body' },
    { slug: 'principal-message', url: '/guru-vishishta/principal-s-message' },
    { slug: 'college-profile', url: '/dsbs#profile' }, // Just fallback
    { slug: 'facilities', url: '/student-experience/facilities' },
    { slug: 'library', url: '/student-experience/library' },
    { slug: 'laboratories', url: '/student-experience/laboratories' },
    { slug: 'admissions', url: '/admissions' },
    { slug: 'academic-calendar', url: '/academics/academic-calendar' },
    { slug: 'events', url: '/events' }
];

async function scrapeContent() {
    for (let p of pages) {
        let finalContentHtml = '<p>Content is currently being aligned with the new design guidelines. Check back later.</p>';
        try {
            console.log(`Fetching ${p.slug}...`);
            const res = await axios.get(`${originalUrl}${p.url}`);
            const $ = cheerio.load(res.data);
            
            // Typical Joomla/WP content area
            let contentHtml = $('.item-page').html() || $('.blog').html() || $('.main-content').html() || '';
            if (contentHtml) {
                // Clean up image URLs to be absolute from their domain to ensure they load
                const $content = cheerio.load(contentHtml);
                $content('img').each((i, el) => {
                    let src = $content(el).attr('src');
                    if (src && !src.startsWith('http')) {
                        $content(el).attr('src', `${originalUrl}/${src.replace(/^\//, '')}`);
                    }
                    $content(el).addClass('img-fluid rounded shadow-sm my-3'); // My modern style
                });
                $content('p, li, td').addClass('text-muted');
                $content('h1, h2, h3, h4').css('color', 'var(--deep-blue)').addClass('fw-bold mt-4');
                $content('table').addClass('table table-bordered table-striped mt-4');
                finalContentHtml = $content.html();
            }
        } catch (e) {
            console.error(`Error fetching ${p.slug}: ${e.message}`);
        }

        const viewContent = `<%- include('partials/header') %>

<section class="py-5 bg-light">
    <div class="container py-4 text-center" data-aos="fade-down">
        <h1 class="display-5 fw-bold" style="color:var(--deep-blue);"><%= page %></h1>
    </div>
</section>

<section class="py-5 mb-5 bg-white min-vh-100">
    <div class="container" data-aos="fade-up">
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <div class="card shadow-lg border-0 bg-white" style="border-radius:15px; border-top: 5px solid var(--sky-blue) !important;">
                    <div class="card-body p-4 p-md-5 content-wrapper" style="line-height: 1.8; font-size: 1.1rem; color: #555;">
                        ${finalContentHtml}
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<%- include('partials/footer') %>`;
        fs.writeFileSync(path.join(__dirname, 'views', `${p.slug}.ejs`), viewContent);
        console.log(`Saved ${p.slug}.ejs`);
    }
}

scrapeContent();
