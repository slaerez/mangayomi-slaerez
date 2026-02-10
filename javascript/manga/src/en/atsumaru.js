const mangayomiSources = [{
    "name": "Atsumaru",
    "id": 74334753,
    "lang": "en",
    "baseUrl": "https://atsu.moe",
    "apiUrl": "",
    "iconUrl": "https://raw.githubusercontent.com/slaerez/mangayomi-slaerez/main/javascript/icon/en.atsumaru.png",
    "typeSource": "single",
    "itemType": 0,
    "isNsfw": true,
    "version": "0.0.1",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "manga/src/en/atsumaru.js",
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
    const baseUrl = this.getBaseUrl();
    const apiPage = Math.max(0, (page || 1) - 1);

    const url =
      `${baseUrl}/api/infinite/trending` +
      `?page=${apiPage}` +
      `&types=Manga,Manwha,Manhua,OEL`;

    const headers = {
      "Accept": "*/*",
      "Host": "atsu.moe",
      "Referer": baseUrl,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    };

    const res = await this.client.get(url, headers);

    let data;
    try {
      data = JSON.parse(res.body);
    } catch (_) {
      return { list: [], hasNextPage: false };
    }

    const items = Array.isArray(data?.items) ? data.items : [];
    const list = [];

    for (const it of items) {
      const id = it?.id;
      const title = it?.title;

      const rawPoster =
        typeof it?.poster === "string"
          ? it.poster
          : (it?.poster && typeof it.poster === "object" ? it.poster.image : null);

      const rawImage =
        typeof it?.image === "string"
          ? it.image
          : (it?.image && typeof it.image === "object" ? it.image.image : null);

      let imgPath = rawPoster || rawImage || null;
      let imageUrl = null;

      if (imgPath) {
        if (/^https?:\/\//i.test(imgPath)) {
          imageUrl = imgPath;
        } else {
          imgPath = String(imgPath).replace(/^\/+/, "").replace(/^static\//, "");
          imageUrl = `${baseUrl}/static/${imgPath}`;
        }
      }

      if (id && title) {
        list.push({
          name: String(title).trim(),
          link: String(id),
          imageUrl,
        });
      }
    }

    return { list, hasNextPage: true };
  }

  get supportsLatest() {
    return true;
  }

  async getLatestUpdates(page) {
    const baseUrl = this.getBaseUrl();
    const apiPage = Math.max(0, (page || 1) - 1);

    const url =
      `${baseUrl}/api/infinite/recentlyUpdated` +
      `?page=${apiPage}` +
      `&types=Manga,Manwha,Manhua,OEL`;

    const headers = {
      "Accept": "*/*",
      "Host": "atsu.moe",
      "Referer": baseUrl,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    };

    const res = await this.client.get(url, headers);

    let data;
    try {
      data = JSON.parse(res.body);
    } catch (_) {
      return { list: [], hasNextPage: false };
    }

    const items = Array.isArray(data?.items) ? data.items : [];
    const list = [];

    for (const it of items) {
      const id = it?.id;
      const title = it?.title;

      const rawPoster =
        typeof it?.poster === "string"
          ? it.poster
          : (it?.poster && typeof it.poster === "object" ? it.poster.image : null);

      const rawImage =
        typeof it?.image === "string"
          ? it.image
          : (it?.image && typeof it.image === "object" ? it.image.image : null);

      let imgPath = rawPoster || rawImage || null;
      let imageUrl = null;

      if (imgPath) {
        if (/^https?:\/\//i.test(imgPath)) {
          imageUrl = imgPath;
        } else {
          imgPath = String(imgPath).replace(/^\/+/, "").replace(/^static\//, "");
          imageUrl = `${baseUrl}/static/${imgPath}`;
        }
      }

      if (id && title) {
        list.push({
          name: String(title).trim(),
          link: String(id),
          imageUrl,
        });
      }
    }

    return { list, hasNextPage: true };
  }

  async search(query, page, filters) {
    const baseUrl = this.getBaseUrl();
    const q = String(query ?? "").trim();
    const p = Math.max(1, page || 1);
    const apiPage = Math.max(0, p - 1);

    const headers = {
      "Accept": "*/*",
      "Host": "atsu.moe",
      "Referer": baseUrl,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    };

    const fs = Array.isArray(filters)
      ? filters
      : (Array.isArray(filters?.filters) ? filters.filters : []);

    const keyOf = (f) => String(f?.type || f?.type_name || "").trim();

    const bodyToString = (b) => {
      if (typeof b === "string") return b;
      if (!b) return "";
      try {
        const arr = Array.isArray(b) ? b : Array.from(b);
        let s = "";
        for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
        return s;
      } catch (_) {
        return String(b);
      }
    };

    const parseJson = (b) => JSON.parse(bodyToString(b));

    const sortFilter = fs.find(f => keyOf(f) === "SortFilter");
    let sortSlug = "trending";
    if (sortFilter?.values && typeof sortFilter?.state === "number") {
      const opt = sortFilter.values[sortFilter.state];
      sortSlug = String(opt?.value || "trending");
    }

    const sortToEndpoint = {
      "trending": "trending",
      "popular": "popular",
      "most-bookmarked": "mostBookmarked",
      "recently-updated": "recentlyUpdated",
      "recently-added": "recentlyAdded",
      "top-rated": "topRated",
    };

    const infiniteUrl = (ep) =>
      `${baseUrl}/api/infinite/${ep}?page=${apiPage}&types=Manga,Manwha,Manhua,OEL`;

    const fetchInfinite = async () => {
      let ep = sortToEndpoint[sortSlug] || "trending";

      try {
        const r1 = await this.client.get(infiniteUrl(ep), headers);
        const d1 = parseJson(r1.body);
        if (d1 && Array.isArray(d1.items)) return d1;
      } catch (_) {}

      if (ep === "topRated") {
        try {
          const r2 = await this.client.get(infiniteUrl("popular"), headers);
          const d2 = parseJson(r2.body);
          if (d2 && Array.isArray(d2.items)) return d2;
        } catch (_) {}
      }

      try {
        const r3 = await this.client.get(infiniteUrl("trending"), headers);
        const d3 = parseJson(r3.body);
        if (d3 && Array.isArray(d3.items)) return d3;
      } catch (_) {}

      return null;
    };

    if (!q) {
      const data = await fetchInfinite();
      if (!data) return { list: [], hasNextPage: false };

      const items = Array.isArray(data.items) ? data.items : [];
      const list = [];

      for (const it of items) {
        const id = it?.id;
        const title = it?.title;
        if (!id || !title) continue;

        const rawPoster =
          typeof it?.poster === "string" ? it.poster : it?.poster?.image;
        const rawImage =
          typeof it?.image === "string" ? it.image : it?.image?.image;

        const raw = rawPoster || rawImage || null;
        const imageUrl = raw
          ? (/^https?:\/\//i.test(raw)
              ? raw
              : `${baseUrl}/static/${String(raw).replace(/^\/+/, "").replace(/^static\//, "")}`)
          : null;

        list.push({ name: String(title).trim(), link: String(id), imageUrl });
      }

      return { list, hasNextPage: true };
    }

    const tsUrl =
      `${baseUrl}/collections/manga/documents/search` +
      `?q=${encodeURIComponent(q)}` +
      `&query_by=${encodeURIComponent("title,englishTitle,otherNames")}` +
      `&limit=24` +
      `&page=${p}` +
      `&query_by_weights=${encodeURIComponent("3,2,1")}` +
      `&include_fields=${encodeURIComponent("id,title,englishTitle,poster")}` +
      `&num_typos=${encodeURIComponent("4,3,2")}`;

    const tsRes = await this.client.get(tsUrl, headers);

    let ts;
    try {
      ts = parseJson(tsRes.body);
    } catch (_) {
      return { list: [], hasNextPage: false };
    }

    const hits = Array.isArray(ts?.hits) ? ts.hits : [];
    const found = Number(ts?.found || 0);
    const perPage = Number(ts?.request_params?.per_page || 24);
    const currentPage = Number(ts?.page || p);

    const list = [];

    for (const h of hits) {
      const doc = h?.document || {};
      const id = doc?.id;
      const title = doc?.title || doc?.englishTitle;
      if (!id || !title) continue;

      const rawPoster =
        typeof doc?.poster === "string" ? doc.poster : doc?.poster?.image;

      const imageUrl = rawPoster
        ? (/^https?:\/\//i.test(rawPoster)
            ? rawPoster
            : `${baseUrl}/static/${String(rawPoster).replace(/^\/+/, "").replace(/^static\//, "")}`)
        : null;

      list.push({ name: String(title).trim(), link: String(id), imageUrl });
    }

    return { list, hasNextPage: currentPage * perPage < found };
  }

  async getDetail(url) {
    const baseUrl = this.getBaseUrl();

    let mangaId = String(url || "").trim();
    if (!mangaId) throw new Error("Invalid manga url: " + url);

    if (/^https?:\/\//i.test(mangaId)) {
      const m = mangaId.match(/\/manga\/([^/?#]+)/i);
      mangaId = m ? m[1] : mangaId.split("/").filter(Boolean).pop();
    } else {
      mangaId = mangaId.replace(/^\/+/, "").replace(/^manga\//i, "");
    }

    const detailUrl = `${baseUrl}/api/manga/page?id=${encodeURIComponent(mangaId)}`;

    const headers = {
      "Accept": "*/*",
      "Host": "atsu.moe",
      "Referer": baseUrl,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    };

    const res = await this.client.get(detailUrl, headers);

    let json;
    try {
      json = JSON.parse(res.body);
    } catch (_) {
      throw new Error("Failed to parse detail JSON");
    }

    const m = json?.mangaPage || {};
    const title = (m?.title || "").trim();

    const pickImagePath = (node) => {
      if (!node) return null;
      if (typeof node === "string") return node;
      if (typeof node === "object") {
        if (typeof node.image === "string") return node.image;
        if (node.image && typeof node.image === "object" && typeof node.image.image === "string") {
          return node.image.image;
        }
      }
      return null;
    };

    let imgPath = pickImagePath(m.poster) || pickImagePath(m.image) || null;
    let imageUrl = null;

    if (imgPath) {
      if (/^https?:\/\//i.test(imgPath)) {
        imageUrl = imgPath;
      } else {
        imgPath = String(imgPath).replace(/^\/+/, "").replace(/^static\//, "");
        imageUrl = `${baseUrl}/static/${imgPath}`;
      }
    }

    const synopsis = m?.synopsis || null;

    const tags = Array.isArray(m?.tags) ? m.tags : [];
    const type = m?.type ? String(m.type).trim() : "";
    const genre = [];
    if (type) genre.push(type);
    for (const t of tags) {
      const n = t?.name ? String(t.name).trim() : "";
      if (n) genre.push(n);
    }

    const authorsArr = Array.isArray(m?.authors) ? m.authors : [];
    const author = authorsArr
      .map(a => (a?.name ? String(a.name).trim() : ""))
      .filter(Boolean)
      .join(", ");

    let status = 2;
    const apiStatus = String(m?.status || "").trim().toLowerCase();

    if (
      apiStatus === "ongoing" ||
      apiStatus === "releasing" ||
      apiStatus === "publishing" ||
      apiStatus === "in progress" ||
      apiStatus.startsWith("ongo")
    ) {
      status = 0;
    } else if (
      apiStatus === "completed" ||
      apiStatus === "finished" ||
      apiStatus === "complete" ||
      apiStatus.startsWith("comp") ||
      apiStatus.startsWith("fin")
    ) {
      status = 1;
    } else if (
      apiStatus === "cancelled" ||
      apiStatus === "canceled" ||
      apiStatus.startsWith("cancel")
    ) {
      status = 3;
    } else {
      status = 2;
    }

    const chapters = [];

    const parseCreatedAt = (v) => {
      if (v == null) return null;
      if (typeof v === "number") return v > 0 ? String(v) : null;
      const s = String(v).trim();
      if (!s) return null;

      if (/^\d{10,13}$/.test(s)) {
        const n = Number(s);
        return n > 0 ? String(n) : null;
      }

      const ms = Date.parse(s.replace("T ", "T"));
      if (!Number.isFinite(ms) || ms <= 0) return null;
      return String(ms);
    };

    const fetchChaptersPage = async (page) => {
      const chapUrl =
        `${baseUrl}/api/manga/chapters` +
        `?id=${encodeURIComponent(mangaId)}` +
        `&filter=all&sort=desc&page=${page}`;

      const r = await this.client.get(chapUrl, headers);
      let j;
      try {
        j = JSON.parse(r.body);
      } catch (_) {
        return null;
      }
      return j;
    };

    let page = 0;
    while (true) {
      const j = await fetchChaptersPage(page);
      if (!j) break;

      const chs = Array.isArray(j?.chapters) ? j.chapters : [];
      for (const c of chs) {
        const cid = c?.id;
        const name = c?.title ? String(c.title).trim() : null;
        const num = c?.number;
        const dateUpload = parseCreatedAt(c?.createdAt);

        if (cid && name) {
          chapters.push({
            name,
            url: `${mangaId}/${cid}`,
            dateUpload,
            chapterNumber: typeof num === "number" ? num : undefined,
          });
        }
      }

      const pages = Number(j?.pages ?? 0);
      const cur = Number(j?.page ?? page);
      if (!(cur + 1 < pages)) break;
      page = cur + 1;
    }

    return {
      name: title || mangaId,
      imageUrl,
      author: author || null,
      artist: author || null,
      genre,
      description: synopsis,
      status,
      chapters,
    };
  }

  async getPageList(url) {
    const baseUrl = this.getBaseUrl();

    const s = String(url || "").trim();
    if (!s) throw new Error("Invalid chapter url: " + url);

    let mangaId = null;
    let chapterId = null;

    if (s.includes("/") && !/^https?:\/\//i.test(s)) {
      const parts = s.split("/").filter(Boolean);
      mangaId = parts[0] || null;
      chapterId = parts[1] || null;
    } else {
      const m = s.match(/\/read\/([^/]+)\/([^/?#]+)/i);
      if (m) {
        mangaId = m[1];
        chapterId = m[2];
      }
    }

    if (!mangaId || !chapterId) {
      throw new Error("Invalid chapter url format: " + s);
    }

    const apiUrl =
      `${baseUrl}/api/read/chapter` +
      `?mangaId=${encodeURIComponent(mangaId)}` +
      `&chapterId=${encodeURIComponent(chapterId)}`;

    const headers = {
      "Accept": "*/*",
      "Host": "atsu.moe",
      "Referer": baseUrl,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    };

    const res = await this.client.get(apiUrl, headers);

    let data;
    try {
      data = JSON.parse(res.body);
    } catch (_) {
      throw new Error("Failed to parse page list JSON");
    }

    const pages = Array.isArray(data?.readChapter?.pages) ? data.readChapter.pages : [];

    return pages
      .map(p => p?.image ? (baseUrl + String(p.image)) : null)
      .filter(Boolean);
  }

  getFilterList() {
    return [
      {
        type_name: "SelectFilter",
        type: "SortFilter",
        name: "Sort",
        state: 0,
        values: [
          ["Trending", "trending"],
          ["Popular", "popular"],
          ["Most Bookmarked", "most-bookmarked"],
          ["Recently Updated", "recently-updated"],
          ["Recently Added", "recently-added"],
          ["Top Rated", "top-rated"],
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
