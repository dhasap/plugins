class KomikcastScraper {
    constructor() {
        this.proxy = 'https://proxy-bacayomi.vercel.app/api/proxy';
        this.baseUrl = 'https://komikcast.li'; // Updated base URL
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
        const url = `${this.baseUrl}/daftar-komik/page/${page}/?status&type&orderby=popular`;
        const doc = await this.fetchAndParse(url);
        
        const comics = [];
        const elements = doc.querySelectorAll('div.list-update_item');
        
        elements.forEach(el => {
            const title = el.querySelector('h3.title')?.innerText.trim();
            const fullUrl = el.querySelector('a')?.href;
            const cover = el.querySelector('.list-update_item-image img')?.src;
            const chapter = el.querySelector('.chapter')?.innerText.trim();
            const endpoint = fullUrl?.split('/').filter(Boolean).pop();

            if (title && endpoint) {
                comics.push({
                    title,
                    chapter,
                    image: `${this.proxy}?url=${encodeURIComponent(cover)}`,
                    url: `${this.baseUrl}/komik/${endpoint}`
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
                    url: `${this.baseUrl}/komik/${endpoint}`
                });
            }
        });

        return comics;
    }

    async getGenres() {
        const url = `${this.baseUrl}/daftar-komik/`;
        const doc = await this.fetchAndParse(url);

        const genres = [];
        const elements = doc.querySelectorAll('.komiklist_dropdown-menu.c4.genrez li');

        elements.forEach(el => {
            const name = el.querySelector('label').innerText.trim();
            const id = el.querySelector('input').value;
            genres.push({ id, name });
        });

        return genres;
    }

    async getMangaDetails(mangaUrl) {
        const doc = await this.fetchAndParse(mangaUrl);

        const title = doc.querySelector('h1.komik_info-content-body-title')?.innerText.trim();
        const synopsis = doc.querySelector('.komik_info-description-sinopsis p')?.innerText.trim();
        const genres = Array.from(doc.querySelectorAll('.komik_info-content-genre a')).map(el => el.innerText.trim());
        const author = doc.querySelector('.komik_info-content-info:nth-child(2)')?.innerText.replace('Author:', '').trim();
        const status = doc.querySelector('.komik_info-content-info:nth-child(3)')?.innerText.replace('Status:', '').trim();
        const type = doc.querySelector('.komik_info-content-info-type a')?.innerText.trim();
        const updated = doc.querySelector('.komik_info-content-update time')?.innerText.trim();
        const cover = doc.querySelector('.komik_info-cover-image img')?.src;

        return {
            title,
            synopsis,
            genres,
            author,
            status,
            type,
            updated,
            image: `${this.proxy}?url=${encodeURIComponent(cover)}`
        };
    }

    async getChapters(mangaUrl) {
        const doc = await this.fetchAndParse(mangaUrl);

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

        const mangaTitle = doc.querySelector('h1.komik_info-content-body-title')?.innerText.trim();
        const mangaEndpoint = mangaUrl.split('/').filter(Boolean).pop();
        localStorage.setItem(`chapters_komikcast_${mangaEndpoint}`, JSON.stringify({ mangaTitle, chapters }));

        return chapters;
    }

    async getImages(chapterUrl) {
        const doc = await this.fetchAndParse(chapterUrl);

        const images = [];
        const elements = doc.querySelectorAll('.main-reading-area img');

        elements.forEach(el => {
            const url = el.src || el.dataset.src;
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
