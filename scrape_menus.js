const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeMenus() {
    try {
        const response = await axios.get('https://dsbs.edu.in/');
        const $ = cheerio.load(response.data);
        const links = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            let text = $(el).text().trim();
            if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
                // To avoid too long texts
                if(text.length > 50) text = text.substring(0, 50);
                links.push({ text, href });
            }
        });
        console.log(JSON.stringify(links, null, 2));
    } catch (error) {
        console.error('Error fetching homepage:', error.message);
    }
}

scrapeMenus();
