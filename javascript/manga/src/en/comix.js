const mangayomiSources = [{
    "name": "Comix",
    "id": 265348000,
    "lang": "en",
    "baseUrl": "https://comix.to",
    "apiUrl": "https://comix.to/api/v2/",
    "iconUrl": "https://raw.githubusercontent.com/slaerez/mangayomi-slaerez/main/javascript/icon/en.comix.png",
    "typeSource": "single",
    "itemType": 0,
    "isNsfw": true,
    "version": "0.0.1",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "manga/src/en/comix.js",
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
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      Accept: "application/json",
    };
  }
    
    
    async getPopular(page) {
  const apiUrl = this.source.apiUrl;

  const url =
    `${apiUrl}manga` +
    `?order[views_30d]=desc` +
    `&limit=50` +
    `&page=${page}`;

  const res = await this.client.get(url, this.getHeaders(url));
  const data = JSON.parse(res.body);

  if (!data.result || !data.result.items) {
    return { list: [], hasNextPage: false };
  }

  const items = data.result.items;
  const pagination = data.result.pagination;

  const list = items.map(manga => {
  const path =
    manga.url
      ? manga.url
      : (manga.hash_id
          ? `/${manga.hash_id}${manga.slug ? `-${manga.slug}` : ""}`
          : `/${manga.slug}`);

  return {
    name: manga.title,
    link: `${this.source.baseUrl}/title${path.startsWith("/") ? path : `/${path}`}`,
    imageUrl:
      manga.poster?.large ||
      manga.poster?.medium ||
      manga.poster?.small ||
      null,
  };
});


  return {
    list,
    hasNextPage:
      pagination.current_page < pagination.last_page,
  };
}

    
    
    get supportsLatest() {
  return true;
}
        
    
    
    async getLatestUpdates(page) {
  const apiUrl = this.source.apiUrl;

  const url =
    `${apiUrl}manga` +
    `?order[chapter_updated_at]=desc` +
    `&limit=50` +
    `&page=${page}`;

  const res = await this.client.get(url, this.getHeaders(url));
  const data = JSON.parse(res.body);

  if (!data.result || !data.result.items) {
    return { list: [], hasNextPage: false };
  }

  const items = data.result.items;
  const pagination = data.result.pagination;

  const list = items.map(manga => {
  const path =
    manga.url
      ? manga.url
      : (manga.hash_id
          ? `/${manga.hash_id}${manga.slug ? `-${manga.slug}` : ""}`
          : `/${manga.slug}`);

  return {
    name: manga.title,
    link: `${this.source.baseUrl}/title${path.startsWith("/") ? path : `/${path}`}`,
    imageUrl:
      manga.poster?.large ||
      manga.poster?.medium ||
      manga.poster?.small ||
      null,
  };
});


  return {
    list,
    hasNextPage:
      pagination.current_page < pagination.last_page,
  };
}
    
    
    async search(query, page, filters) {
  const apiUrl = this.source.apiUrl;

  const encodeKey = (k) =>
    encodeURIComponent(k).replace(/%5B/g, "[").replace(/%5D/g, "]");

  const addParam = (params, key, value) => {
    if (value === undefined || value === null || value === "") return;
    params.push(`${encodeKey(key)}=${encodeURIComponent(String(value))}`);
  };

  const getStateIndex = (f) => {
    if (typeof f?.state === "number") return f.state;
    if (f?.state && typeof f.state.index === "number") return f.state.index;
    return 0;
  };

  const getAscending = (f) => {
    if (typeof f?.ascending === "boolean") return f.ascending;
    if (f?.state && typeof f.state.ascending === "boolean") return f.state.ascending;
    return false;
  };

  const params = [];

  const fs = Array.isArray(filters) ? filters : (Array.isArray(filters?.filters) ? filters.filters : []);

  for (const f of fs) {
    if (!f) continue;

    if (f.type_name === "SelectFilter" && (f.type === "SortFilter" || f.name === "Sort")) {
      const idx = getStateIndex(f);
      const asc = getAscending(f);
      const opt = Array.isArray(f.values) ? f.values[idx] : null;
      const sortKey = opt?.value;
      if (sortKey) {
        addParam(params, `order[${sortKey}]`, asc ? "asc" : "desc");
      }
      continue;
    }

    if (f.type_name === "GroupFilter" && Array.isArray(f.state)) {
      if (f.type === "StatusFilter" || f.name === "Status") {
        for (const o of f.state) {
          if (o && o.type_name === "CheckBox" && o.state === true) {
            addParam(params, "statuses[]", o.value);
          }
        }
        continue;
      }

      if (f.type === "TypeFilter" || f.name === "Type") {
        for (const o of f.state) {
          if (o && o.type_name === "CheckBox" && o.state === true) {
            addParam(params, "types[]", o.value);
          }
        }
        continue;
      }

      if (f.type === "GenreFilter" || f.name === "Genre") {
        for (const o of f.state) {
          const s = o?.state;
          if (s === 1) addParam(params, "genres[]", o.value);
          if (s === 2) addParam(params, "genres[]", `-${o.value}`);
        }
        continue;
      }

      if (f.type === "DemographicFilter" || f.name === "Demographic") {
        for (const o of f.state) {
          const s = o?.state;
          if (s === 1) addParam(params, "demographics[]", o.value);
          if (s === 2) addParam(params, "demographics[]", `-${o.value}`);
        }
        continue;
      }
    }
  }

  if (query && query.trim()) {
    addParam(params, "keyword", query.trim());

    const filtered = [];
    for (const p of params) {
      if (!p.startsWith("order[views_30d]=")) filtered.push(p);
    }
    filtered.push(`${encodeKey("order[relevance]")}=desc`);
    params.length = 0;
    params.push(...filtered);
  }

  addParam(params, "limit", "50");
  addParam(params, "page", String(page));

  const url = `${apiUrl}manga?${params.join("&")}`;

  const res = await this.client.get(url, this.getHeaders(url));
  const data = JSON.parse(res.body);

  if (!data.result || !data.result.items) {
    return { list: [], hasNextPage: false };
  }

  const items = data.result.items;
  const pagination = data.result.pagination;

  const list = items.map(manga => {
    const path =
      manga.url
        ? manga.url
        : (manga.hash_id
            ? `/${manga.hash_id}${manga.slug ? `-${manga.slug}` : ""}`
            : `/${manga.slug}`);

    return {
      name: manga.title,
      link: `${this.source.baseUrl}/title${path.startsWith("/") ? path : `/${path}`}`,
      imageUrl:
        manga.poster?.large ||
        manga.poster?.medium ||
        manga.poster?.small ||
        null,
    };
  });

  return {
    list,
    hasNextPage: pagination.current_page < pagination.last_page,
  };
}


    
    
    
    
    async getDetail(url) {
  const baseUrl = this.source.baseUrl;
  const apiUrl = this.source.apiUrl;

  const fullUrl = url.startsWith("http")
    ? url
    : (url.startsWith("/") ? baseUrl + url : baseUrl + "/" + url);

  const clean = fullUrl.split("?")[0].split("#")[0].replace(/\/+$/, "");

  let hashId = null;
  let slug = null;
  let tail = null;

  const t1 = clean.match(/\/title\/([^\/]+)$/);
  if (t1) {
    tail = t1[1];
  } else {
    const t2 = clean.match(/\/title([^\/]+)$/);
    if (t2) {
      tail = t2[1].replace(/^\/+/, "");
    }
  }

  tail = (tail || clean.split("/").pop() || "").trim();

  const isComixId = (s) => /^[A-Za-z0-9]{4,20}$/.test(String(s || ""));

  if (tail.includes("-")) {
    const first = tail.split("-")[0];
    const rest = tail.slice(first.length + 1);
    if (isComixId(first)) {
      hashId = first;
      slug = rest || null;
    } else {
      slug = tail;
    }
  } else {
    if (isComixId(tail)) hashId = tail;
    else slug = tail;
  }

  const buildDetailApi = (id) =>
    `${apiUrl}manga/${id}` +
    `?includes[]=demographic` +
    `&includes[]=genre` +
    `&includes[]=theme` +
    `&includes[]=author` +
    `&includes[]=artist` +
    `&includes[]=publisher`;

  const fetchDetail = async (id) => {
    const detailApi = buildDetailApi(id);
    const res = await this.client.get(detailApi, this.getHeaders(detailApi));
    return JSON.parse(res.body);
  };

  let data = null;

  if (hashId) {
    const d = await fetchDetail(hashId);
    if (d && d.result) data = d;
  }

  if (!data && slug) {
    const searchApi =
      `${apiUrl}manga` +
      `?keyword=${encodeURIComponent(slug)}` +
      `&order[relevance]=desc&limit=5&page=1`;

    const sRes = await this.client.get(searchApi, this.getHeaders(searchApi));
    const sData = JSON.parse(sRes.body);
    const foundHash = sData?.result?.items?.[0]?.hash_id;

    if (foundHash) {
      const d = await fetchDetail(foundHash);
      if (d && d.result) data = d;
    }
  }

  if (!data || !data.result) {
    throw new Error("Manga not found");
  }

  const m = data.result;

  const author = (Array.isArray(m.author) ? m.author : [])
    .map(a => a?.title)
    .filter(Boolean)
    .join(", ");

  const genre = [];
  const pushTitles = (arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach(x => {
      if (x?.title) genre.push(x.title);
    });
  };

  pushTitles(m.genre);
  pushTitles(m.theme);
  pushTitles(m.demographic);

  let description = "";
  if (typeof m.rated_avg === "number") {
    description += `Score: ${m.rated_avg}\n\n`;
  }
  if (m.synopsis) {
    description += String(m.synopsis).trim();
  }
  description = description.trim();

  let status = 0;


const apiStatus = String(m.status || "").toLowerCase();
if (
  apiStatus === "finished" ||
  apiStatus === "completed" ||
  apiStatus === "complete"
) {
  status = 1;
} else if (
  apiStatus === "releasing" ||
  apiStatus === "ongoing"
) {
  status = 0;
} else {
  
  try {
    const pageRes = await this.client.get(fullUrl, this.getHeaders(fullUrl));
    const html = String(pageRes.body || "");
    const sm = html.match(/\[\s*\d{4}\s+(RELEASING|FINISHED)\s*\]/i);
    if (sm && sm[1].toUpperCase() === "FINISHED") status = 1;
  } catch (_) {}
}


  const chapters = [];
  const mangaHash = hashId || m.hash_id || m.id;

  const toMsString = (v) => {
    if (typeof v !== "number") return null;
    if (v <= 0) return null;
    return String(v * 1000);
  };

  if (mangaHash) {
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const chapApi =
        `${apiUrl}manga/${mangaHash}/chapters` +
        `?order[number]=desc&limit=100&page=${page}`;

      const cRes = await this.client.get(chapApi, this.getHeaders(chapApi));
      const cData = JSON.parse(cRes.body);

      const items = cData?.result?.items || [];
      const pag = cData?.result?.pagination || {};

      const cur = Number(pag.current_page ?? pag.page ?? page);
      const last = Number(pag.last_page ?? cur);

      for (const ch of items) {
        const chapterId =
  ch?.id ||
  ch?.chapter_id ||
  ch?.chapterId ||
  (typeof ch?.url === "string" ? ch.url.split("/").pop() : null);

if (!chapterId) continue;


        const rawNum = ch?.number;
const num = (rawNum === undefined || rawNum === null) ? "" : String(rawNum).trim();

const chapterTitle = String(
  ch?.title ??
  ch?.name ??
  ch?.chapter_title ??
  ch?.chapterTitle ??
  ch?.chapter_name ??
  ch?.chapterName ??
  ""
).trim();

let name = "Chapter";
if (num) name = `Chapter ${num}`;
if (chapterTitle) name += `: ${chapterTitle}`;


        const dateUpload = toMsString(
          ch.updated_at ?? ch.created_at
        );

        const item = {
          name,
          url: `${apiUrl}chapters/${chapterId}`,
        };
        if (dateUpload) item.dateUpload = dateUpload;

        chapters.push(item);
      }

      hasNext = last > cur;
      if (!hasNext && items.length === 100) hasNext = true;

      page++;
      if (page > 500) break;
    }
  }

  return {
    name: m.title,
    imageUrl: m.poster?.large || m.poster?.medium || m.poster?.small || null,
    description,
    author,
    genre,
    status,
    chapters,
  };
}

    

    async getPageList(url) {
  const apiUrl = this.source.apiUrl;

  const chapterApiUrl = url.startsWith("http")
    ? url
    : (url.startsWith("/") ? apiUrl.replace(/\/+$/, "") + url : apiUrl.replace(/\/+$/, "") + "/" + url);

  const res = await this.client.get(chapterApiUrl, this.getHeaders(chapterApiUrl));
  const data = JSON.parse(res.body);

  const result = data?.result;
  if (!result) {
    throw new Error("Chapter not found");
  }

  const images = Array.isArray(result.images) ? result.images : [];
  if (!images.length) {
    throw new Error(`No images found for chapter ${result.chapterId || ""}`.trim());
  }

  const pages = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgUrl = img?.url;
    if (imgUrl) {
      pages.push({
        url: imgUrl,
        headers: this.getHeaders(imgUrl),
      });
    }
  }

  if (!pages.length) {
    throw new Error("No pages available");
  }

  return pages;
}

    
    
    
    getFilterList() {
  return [
    {
      type_name: "HeaderFilter",
      name: "Filters are ignored during text-based searches.",
    },

    {
      type_name: "SelectFilter",
      type: "SortFilter",
      name: "Sort",
      state: 0,
      values: [
        ["Best Match", "relevance"],
        ["Popular", "views_30d"],
        ["Updated Date", "chapter_updated_at"],
        ["Created Date", "created_at"],
        ["Title", "title"],
        ["Year", "year"],
        ["Total Views", "views_total"],
        ["Most Follows", "follows_total"],
      ].map(x => ({
        type_name: "SelectOption",
        name: x[0],
        value: x[1],
      })),
    },

    {
      type_name: "GroupFilter",
      type: "StatusFilter",
      name: "Status",
      state: [
        ["Finished", "finished"],
        ["Releasing", "releasing"],
        ["On Hiatus", "on_hiatus"],
        ["Discontinued", "discontinued"],
        ["Not Yet Released", "not_yet_released"],
      ].map(x => ({
        type_name: "CheckBox",
        name: x[0],
        value: x[1],
      })),
    },

    {
      type_name: "GroupFilter",
      type: "GenreFilter",
      name: "Genre",
      state: [
        ["Action", "6"],
        ["Adult", "87264"],
        ["Adventure", "7"],
        ["Boys Love", "8"],
        ["Comedy", "9"],
        ["Crime", "10"],
        ["Drama", "11"],
        ["Ecchi", "87265"],
        ["Fantasy", "12"],
        ["Girls Love", "13"],
        ["Hentai", "87266"],
        ["Historical", "14"],
        ["Horror", "15"],
        ["Isekai", "16"],
        ["Magical Girls", "17"],
        ["Mature", "87267"],
        ["Mecha", "18"],
        ["Medical", "19"],
        ["Mystery", "20"],
        ["Philosophical", "21"],
        ["Psychological", "22"],
        ["Romance", "23"],
        ["Sci-Fi", "24"],
        ["Slice of Life", "25"],
        ["Smut", "87268"],
        ["Sports", "26"],
        ["Superhero", "27"],
        ["Thriller", "28"],
        ["Tragedy", "29"],
        ["Wuxia", "30"],
        ["Aliens", "31"],
        ["Animals", "32"],
        ["Cooking", "33"],
        ["Cross Dressing", "34"],
        ["Delinquents", "35"],
        ["Demons", "36"],
        ["Genderswap", "37"],
        ["Ghosts", "38"],
        ["Gyaru", "39"],
        ["Harem", "40"],
        ["Incest", "41"],
        ["Loli", "42"],
        ["Mafia", "43"],
        ["Magic", "44"],
        ["Martial Arts", "45"],
        ["Military", "46"],
        ["Monster Girls", "47"],
        ["Monsters", "48"],
        ["Music", "49"],
        ["Ninja", "50"],
        ["Office Workers", "51"],
        ["Police", "52"],
        ["Post-Apocalyptic", "53"],
        ["Reincarnation", "54"],
        ["Reverse Harem", "55"],
        ["Samurai", "56"],
        ["School Life", "57"],
        ["Shota", "58"],
        ["Supernatural", "59"],
        ["Survival", "60"],
        ["Time Travel", "61"],
        ["Traditional Games", "62"],
        ["Vampires", "63"],
        ["Video Games", "64"],
        ["Villainess", "65"],
        ["Virtual Reality", "66"],
        ["Zombies", "67"],
      ].map(x => ({
        type_name: "TriState",
        name: x[0],
        value: x[1],
      })),
    },

    {
      type_name: "GroupFilter",
      type: "DemographicFilter",
      name: "Demographic",
      state: [
        ["Shoujo", "1"],
        ["Shounen", "2"],
        ["Josei", "3"],
        ["Seinen", "4"],
      ].map(x => ({
        type_name: "TriState",
        name: x[0],
        value: x[1],
      })),
    },

    {
      type_name: "GroupFilter",
      type: "TypeFilter",
      name: "Type",
      state: [
        ["Manga", "manga"],
        ["Manhwa", "manhwa"],
        ["Manhua", "manhua"],
        ["Other", "other"],
      ].map(x => ({
        type_name: "CheckBox",
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

