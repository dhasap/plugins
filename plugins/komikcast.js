class KomikcastScraper {
    constructor() {
        this.proxy = 'https://proxy-bacayomi.vercel.app/api/proxy';
        this.baseUrl = 'https://komikcast.lol'; // Updated base URL
    }

    async fetchAndParse(url) {
        try {
            const response = await fetch(`${this.proxy}?url=${encodeURIComponent(url)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlString = await response.text();
            const parser = new DOMParser();
            return parser.parseFromString(htmlString, 'text/html');
        } catch (error) {
            console.error(`Error fetching or parsing ${url}:`, error);
            throw error;
        }
    }

    async getPopular(page = 1) {
        const url = `${this.baseUrl}/?page=${page}`;
        const doc = await this.fetchAndParse(url);
        
        const comics = [];
        const elements = doc.querySelectorAll('div.listupd .utao');
        
        elements.forEach(el => {
            const title = el.querySelector('.luf a h3')?.innerText.trim();
            const fullUrl = el.querySelector('.imgu a')?.href;
            const cover = el.querySelector('.imgu a img')?.src;
            const chapter = el.querySelector('.luf ul li:first-child a')?.innerText.trim();
            const endpoint = fullUrl?.split('/')[4];

            if (title && endpoint) {
                comics.push({
                    title,
                    chapter,
                    image: `${this.proxy}?url=${encodeURIComponent(cover)}`,
                    url: `/komik/${endpoint}`
                });
            }
        });
        
        return comics;
    }

    async search(query) {
        const url = `${this.baseUrl}/?s=${query}`;
        const doc = await this.fetchAndParse(url);

        const comics = [];
        const elements = doc.querySelectorAll('div.listupd .bs');

        elements.forEach(el => {
            const title = el.querySelector('.tt')?.innerText.trim();
            const fullUrl = el.querySelector('a')?.href;
            const cover = el.querySelector('img')?.src;
            const endpoint = fullUrl?.split('/')[4];

            if (title && endpoint) {
                comics.push({
                    title,
                    image: `${this.proxy}?url=${encodeURIComponent(cover)}`,
                    url: `/komik/${endpoint}`
                });
            }
        });

        return comics;
    }

    async getMangaDetails(mangaUrl) {
        const url = `${this.baseUrl}${mangaUrl}`;
        const doc = await this.fetchAndParse(url);

        const title = doc.querySelector('.komik_info-content-body-title')?.innerText.trim();
        const synopsis = doc.querySelector('.komik_info-description-sinopsis')?.innerText.trim();
        const genres = Array.from(doc.querySelectorAll('.komik_info-content-genre a')).map(el => el.innerText.trim());
        const status = doc.querySelector('.komik_info-content-info:contains("Status")')?.innerText.split(':')[1].trim();
        const cover = doc.querySelector('.komik_info-content-thumbnail img')?.src;

        return {
            title,
            synopsis,
            genres,
            status,
            image: `${this.proxy}?url=${encodeURIComponent(cover)}`
        };
    }

    async getChapters(mangaUrl) {
        const url = `${this.baseUrl}${mangaUrl}`;
        const doc = await this.fetchAndParse(url);

        const chapters = [];
        const elements = doc.querySelectorAll('li.komik_info-chapters-item');

        elements.forEach(el => {
            const title = el.querySelector('a.chapter-link-item')?.innerText.trim();
            const url = el.querySelector('a.chapter-link-item')?.href;
            const date = el.querySelector('div.chapter-link-time')?.innerText.trim();

            if (title && url) {
                chapters.push({
                    title,
                    url,
                    date
                });
            }
        });

        return chapters;
    }

    async getImages(chapterUrl) {
        const doc = await this.fetchAndParse(chapterUrl);

        const images = [];
        const elements = doc.querySelectorAll('.main-reading-area img');

        elements.forEach(el => {
            const url = el.src;
            if (url) {
                images.push(`${this.proxy}?url=${encodeURIComponent(url)}`);
            }
        });

        return images;
    }
}

export default {
    id: 'komikcast',
    name: 'Komikcast',
    scraper: new KomikcastScraper()
};
