const mangayomiSources = [{
    "name": "Manga18fx",
    "id": 159008493,
    "lang": "en",
    "baseUrl": "https://manga18fx.com",
    "apiUrl": "",
    "iconUrl": "https://raw.githubusercontent.com/mangayomi-slaerez/myext/main/javascript/icon/en.manga18fx.png",
    "typeSource": "single",
    "itemType": 0,
    "isNsfw": true,
    "version": "0.0.1",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "manga/src/en/manga18fx.js",
}];


class DefaultExtension extends MProvider {
  constructor() {
    super();
    this.client = new Client();
  }

  getBaseUrl() {
    return this.source.baseUrl;
  }

  getHeaders(url) {
    return {
      'Referer': url,
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    };
  }
    
        
    async getPopular(page) {
    const baseUrl = "https://manga18fx.com";
    const url = baseUrl;

    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    const list = [];

    const items = doc.select(".trending-block a");

    for (const el of items) {
        const link = el.attr("href");
        const name = el.attr("title");
        const imageUrl = el.selectFirst("img")?.attr("data-src");

        if (link && name) {
            list.push({
                name,
                link,
                imageUrl,
            });
        }
    }

    return {
        list,
        hasNextPage: false
    };
}
    
    
    get supportsLatest() {
  return true;
}
    
    
    async getLatestUpdates(page) {
    const baseUrl = "https://manga18fx.com";
    const url = `${baseUrl}/page/${page}`;

    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    return this._parseLatestLike(doc, page);
}

    
    
    async search(query, page, filters) {
    const baseUrl = "https://manga18fx.com";
    const q = (query || "").trim();

    if (!q) {
        let genreUrl = null;

        if (filters && filters.length) {
            const gf = filters.find(f => f.type === "GenreFilter");
            if (gf && typeof gf.state === "number" && gf.state > 0) {
                const opt = gf.values && gf.values[gf.state];
                if (opt && opt.value) genreUrl = String(opt.value);
            }
        }

        if (genreUrl) {
            const clean = genreUrl.replace(/\/$/, "");

            if (page > 1) {
                const urlA = `${clean}/page/${page}`;
                const resA = await this.client.get(urlA, this.getHeaders(urlA));
                const docA = new Document(resA.body);
                const parsedA = this._parseLatestLike(docA, page);

                if (parsedA.list && parsedA.list.length) return parsedA;

                const urlB = `${clean}/${page}`;
                const resB = await this.client.get(urlB, this.getHeaders(urlB));
                const docB = new Document(resB.body);
                return this._parseLatestLike(docB, page);
            }

            const res = await this.client.get(clean, this.getHeaders(clean));
            const doc = new Document(res.body);
            return this._parseLatestLike(doc, page);
        }

        return this.getLatestUpdates(page);
    }

    const url = `${baseUrl}/search?q=${encodeURIComponent(q)}&page=${page}`;
    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    return this._parseLatestLike(doc, page);
}

    
    _parseLatestLike(doc, requestedPage) {
    const list = [];
    const items = doc.select(".bsx-item");

    for (const el of items) {
        const a = el.selectFirst("a");
        if (!a) continue;

        const link = a.attr("href");
        const name = a.attr("title");
        const img = a.selectFirst("img");
        const imageUrl = img ? (img.attr("data-src") || img.attr("src")) : null;

        if (link && name) list.push({ name, link, imageUrl });
    }

    const active = doc.select("ul.pagination li.active a");
    if (requestedPage > 1 && active && active.length > 0) {
        const href = (active[0].attr("href") || "");
        const m =
            href.match(/[?&]page=(\d+)/i) ||
            href.match(/\/(\d+)(?:\/)?$/i);

        const current = m ? parseInt(m[1], 10) : null;

        if (current && current !== requestedPage) {
            return { list: [], hasNextPage: false };
        }
    }

    const liNextDisabled = doc.select("ul.pagination li.next.disabled");
    if (liNextDisabled && liNextDisabled.length > 0) {
        return { list, hasNextPage: false };
    }

    const liNextLink = doc.select("ul.pagination li.next a[href]");
    if (liNextLink && liNextLink.length > 0) {
        return { list, hasNextPage: true };
    }

    return { list, hasNextPage: false };
}
    
        
    
    parseChapterDate(text) {
    if (!text) return null;

    const parts = text.trim().split(/\s+/);
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    let year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(year)) return null;

    year += year < 70 ? 2000 : 1900;

    const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const month = months[monthStr];
    if (month === undefined) return null;

    
    const millis = new Date(year, month, day).getTime();

    if (!millis || millis <= 0) return null;

    
    return String(millis);
}

    
    
    async getDetail(url) {
    const baseUrl = "https://manga18fx.com";
    const fullUrl = url.startsWith("http") ? url : baseUrl + url;

    const res = await this.client.get(fullUrl, this.getHeaders(fullUrl));
    const doc = new Document(res.body);

    const title =
        doc.selectFirst("h1")?.text ||
        doc.selectFirst(".post-title")?.text ||
        "";

    const imageUrl =
        doc.selectFirst(".meta-image img")?.attr("data-src") ||
        doc.selectFirst(".meta-image img")?.attr("src") ||
        doc.selectFirst(".summary_image img")?.attr("data-src") ||
        doc.selectFirst(".summary_image img")?.attr("src") ||
        "";

    const description =
        doc.selectFirst(".dsct")?.text || "";

    const author = doc
        .select(".post-content_item:contains(Author) a")
        .map(e => e.text)
        .join(", ");

    const genre = [
        ...doc.select(".genres a"),
        ...doc.select(".post-content_item:contains(Genres) a")
    ]
        .map(e => e.text)
        .filter(Boolean);

    const chapters = [];
    const chapterContainer = doc.selectFirst(".row-content-chapter");

    if (chapterContainer) {
    const items = chapterContainer.select("li");

    for (const el of items) {
        const a = el.selectFirst("a");
        if (!a) continue;

        const dateText =
    el.selectFirst("span.chapter-time")?.text || null;

chapters.push({
    name: a.text,
    url: a.attr("href"),
    dateUpload: this.parseChapterDate(dateText)
});

    }
}



    return {
        name: title,
        imageUrl,
        description,
        author,
        genre,
        status: 1,
        chapters
    };
}

    

    async getPageList(url) {
    const baseUrl = "https://manga18fx.com";
    const fullUrl = url.startsWith("http") ? url : baseUrl + url;

    const res = await this.client.get(fullUrl, this.getHeaders(fullUrl));
    const doc = new Document(res.body);

    const pages = [];

    const images = doc.select(".page-break img");

    for (const img of images) {
        const src =
            img.attr("data-src") ||
            img.attr("src");

        if (src && src.startsWith("http")) {
            pages.push(src);
        }
    }

    if (!pages.length) {
        throw new Error("No pages available");
    }

    return pages;
}

    
    getFilterList() {
    const baseUrl = this.getBaseUrl();

    return [
        {
            type_name: "SelectFilter",
            type: "GenreFilter",
            name: "Genre",
            state: 0,
            values: [
                ["Manhwa", `${baseUrl}/manga-genre/manhwa`],
                ["Manhua", `${baseUrl}/manga-genre/manhua`],

                ["Raw", `${baseUrl}/manhwa-raw`],
                ["Uncensored", `${baseUrl}/manga-genre/uncensored-manhwa`],

                ["Drama", `${baseUrl}/manga-genre/drama`],
                ["Action", `${baseUrl}/manga-genre/action`],
                ["Romance", `${baseUrl}/manga-genre/romance`],
                ["Harem", `${baseUrl}/manga-genre/harem`],
                ["Seinen", `${baseUrl}/manga-genre/seinen`],
                ["School Life", `${baseUrl}/manga-genre/school-life`],
                ["Mature", `${baseUrl}/manga-genre/mature`],
                ["Psychological", `${baseUrl}/manga-genre/psychological`],
                ["Tragedy", `${baseUrl}/manga-genre/tragedy`],
                ["Ecchi", `${baseUrl}/manga-genre/ecchi`],
                ["Comedy", `${baseUrl}/manga-genre/comedy`],
                ["Fantasy", `${baseUrl}/manga-genre/fantasy`],
                ["Supernatural", `${baseUrl}/manga-genre/supernatural`],
                ["Isekai", `${baseUrl}/manga-genre/isekai`],
                ["Shoujo", `${baseUrl}/manga-genre/shoujo`],
                ["Adventure", `${baseUrl}/manga-genre/adventure`],
                ["Shounen", `${baseUrl}/manga-genre/shounen`],
                ["Mystery", `${baseUrl}/manga-genre/mystery`],
                ["Thriller", `${baseUrl}/manga-genre/thriller`],
                ["Reincarnation", `${baseUrl}/manga-genre/reincarnation`],
            ].map(x => ({
                type_name: "SelectOption",
                name: x[0],
                value: x[1],
            })),
        },
    ];
}
    
    
    
    
    
    getSourcePreferences() {
        throw new Error("getSourcePreferences not implemented");
    }
}