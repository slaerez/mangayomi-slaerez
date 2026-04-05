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
    "version": "0.0.2",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "manga/src/en/comix.js",
}];

const ComixHash = {
  KEYS: [
    "13YDu67uDgFczo3DnuTIURqas4lfMEPADY6Jaeqky+w=",
    "yEy7wBfBc+gsYPiQL/4Dfd0pIBZFzMwrtlRQGwMXy3Q=",
    "yrP+EVA1Dw==",
    "vZ23RT7pbSlxwiygkHd1dhToIku8SNHPC6V36L4cnwM=",
    "QX0sLahOByWLcWGnv6l98vQudWqdRI3DOXBdit9bxCE=",
    "WJwgqCmf",
    "BkWI8feqSlDZKMq6awfzWlUypl88nz65KVRmpH0RWIc=",
    "v7EIpiQQjd2BGuJzMbBA0qPWDSS+wTJRQ7uGzZ6rJKs=",
    "1SUReYlCRA==",
    "RougjiFHkSKs20DZ6BWXiWwQUGZXtseZIyQWKz5eG34=",
    "LL97cwoDoG5cw8QmhI+KSWzfW+8VehIh+inTxnVJ2ps=",
    "52iDqjzlqe8=",
    "U9LRYFL2zXU4TtALIYDj+lCATRk/EJtH7/y7qYYNlh8=",
    "e/GtffFDTvnw7LBRixAD+iGixjqTq9kIZ1m0Hj+s6fY=",
    "xb2XwHNB",
  ],

  b64ToBytes(b64) {
    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      const clean = String(b64 || "").replace(/[\r\n\s]/g, "").replace(/=+$/, "");
      let buffer = 0;
      let bits = 0;
      const out = [];
      for (let i = 0; i < clean.length; i++) {
        const val = chars.indexOf(clean[i]);
        if (val < 0) continue;
        buffer = (buffer << 6) | val;
        bits += 6;
        if (bits >= 8) {
          bits -= 8;
          out.push((buffer >> bits) & 255);
        }
      }
      return out;
    } catch (_) {
      return [];
    }
  },

  getKeyBytes(index) {
    return this.b64ToBytes(this.KEYS[index] || "");
  },

  rc4(key, data) {
    if (!key || !key.length) return data.slice();
    const s = Array.from({ length: 256 }, (_, i) => i);
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + s[i] + key[i % key.length]) % 256;
      const tmp = s[i];
      s[i] = s[j];
      s[j] = tmp;
    }
    let i = 0;
    j = 0;
    const out = [];
    for (let k = 0; k < data.length; k++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;
      const tmp = s[i];
      s[i] = s[j];
      s[j] = tmp;
      out.push(data[k] ^ s[(s[i] + s[j]) % 256]);
    }
    return out;
  },

  mutS(e) { return (e + 143) % 256; },
  mutL(e) { return ((e >>> 1) | (e << 7)) & 255; },
  mutC(e) { return (e + 115) % 256; },
  mutM(e) { return e ^ 177; },
  mutF(e) { return (e - 188 + 256) % 256; },
  mutG(e) { return ((e << 2) | (e >>> 6)) & 255; },
  mutH(e) { return (e - 42 + 256) % 256; },
  mutDollar(e) { return ((e << 4) | (e >>> 4)) & 255; },
  mutB(e) { return (e - 12 + 256) % 256; },
  mutUnderscore(e) { return (e - 20 + 256) % 256; },
  mutY(e) { return ((e >>> 1) | (e << 7)) & 255; },
  mutK(e) { return (e - 241 + 256) % 256; },

  getMutKey(mk, idx) {
    return mk.length && (idx % 32) < mk.length ? mk[idx % 32] : 0;
  },

  round1(data) {
    const enc = this.rc4(this.getKeyBytes(0), data);
    const mutKey = this.getKeyBytes(1);
    const prefKey = this.getKeyBytes(2);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
      if (i < 7 && i < prefKey.length) out.push(prefKey[i]);
      let v = enc[i] ^ this.getMutKey(mutKey, i);
      switch (i % 10) {
        case 0:
        case 9: v = this.mutC(v); break;
        case 1: v = this.mutB(v); break;
        case 2: v = this.mutY(v); break;
        case 3: v = this.mutDollar(v); break;
        case 4:
        case 6: v = this.mutH(v); break;
        case 5: v = this.mutS(v); break;
        case 7: v = this.mutK(v); break;
        case 8: v = this.mutL(v); break;
      }
      out.push(v & 255);
    }
    return out;
  },

  round2(data) {
    const enc = this.rc4(this.getKeyBytes(3), data);
    const mutKey = this.getKeyBytes(4);
    const prefKey = this.getKeyBytes(5);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
      if (i < 6 && i < prefKey.length) out.push(prefKey[i]);
      let v = enc[i] ^ this.getMutKey(mutKey, i);
      switch (i % 10) {
        case 0:
        case 8: v = this.mutC(v); break;
        case 1: v = this.mutB(v); break;
        case 2:
        case 6: v = this.mutDollar(v); break;
        case 3: v = this.mutH(v); break;
        case 4:
        case 9: v = this.mutS(v); break;
        case 5: v = this.mutK(v); break;
        case 7: v = this.mutUnderscore(v); break;
      }
      out.push(v & 255);
    }
    return out;
  },

  round3(data) {
    const enc = this.rc4(this.getKeyBytes(6), data);
    const mutKey = this.getKeyBytes(7);
    const prefKey = this.getKeyBytes(8);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
      if (i < 7 && i < prefKey.length) out.push(prefKey[i]);
      let v = enc[i] ^ this.getMutKey(mutKey, i);
      switch (i % 10) {
        case 0: v = this.mutC(v); break;
        case 1: v = this.mutF(v); break;
        case 2:
        case 8: v = this.mutS(v); break;
        case 3: v = this.mutG(v); break;
        case 4: v = this.mutY(v); break;
        case 5: v = this.mutM(v); break;
        case 6: v = this.mutDollar(v); break;
        case 7: v = this.mutK(v); break;
        case 9: v = this.mutB(v); break;
      }
      out.push(v & 255);
    }
    return out;
  },

  round4(data) {
    const enc = this.rc4(this.getKeyBytes(9), data);
    const mutKey = this.getKeyBytes(10);
    const prefKey = this.getKeyBytes(11);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
      if (i < 8 && i < prefKey.length) out.push(prefKey[i]);
      let v = enc[i] ^ this.getMutKey(mutKey, i);
      switch (i % 10) {
        case 0: v = this.mutB(v); break;
        case 1:
        case 9: v = this.mutM(v); break;
        case 2:
        case 7: v = this.mutL(v); break;
        case 3:
        case 5: v = this.mutS(v); break;
        case 4:
        case 6: v = this.mutUnderscore(v); break;
        case 8: v = this.mutY(v); break;
      }
      out.push(v & 255);
    }
    return out;
  },

  round5(data) {
    const enc = this.rc4(this.getKeyBytes(12), data);
    const mutKey = this.getKeyBytes(13);
    const prefKey = this.getKeyBytes(14);
    const out = [];
    for (let i = 0; i < enc.length; i++) {
      if (i < 6 && i < prefKey.length) out.push(prefKey[i]);
      let v = enc[i] ^ this.getMutKey(mutKey, i);
      switch (i % 10) {
        case 0: v = this.mutUnderscore(v); break;
        case 1:
        case 7: v = this.mutS(v); break;
        case 2: v = this.mutC(v); break;
        case 3:
        case 5: v = this.mutM(v); break;
        case 4: v = this.mutB(v); break;
        case 6: v = this.mutF(v); break;
        case 8: v = this.mutDollar(v); break;
        case 9: v = this.mutG(v); break;
      }
      out.push(v & 255);
    }
    return out;
  },

  bytesToBase64Url(bytes) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const b1 = bytes[i];
      const b2 = i + 1 < bytes.length ? bytes[i + 1] : NaN;
      const b3 = i + 2 < bytes.length ? bytes[i + 2] : NaN;

      const n = ((b1 || 0) << 16) | ((b2 || 0) << 8) | (b3 || 0);

      out += chars[(n >> 18) & 63];
      out += chars[(n >> 12) & 63];
      if (!Number.isNaN(b2)) out += chars[(n >> 6) & 63];
      if (!Number.isNaN(b3)) out += chars[n & 63];
    }
    return out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  },

  generateHash(path, bodySize = 0, time = 1) {
    const baseString = `${path}:${bodySize}:${time}`;
    const encoded = encodeURIComponent(baseString)
      .replace(/\+/g, "%20")
      .replace(/\*/g, "%2A")
      .replace(/%7E/g, "~");

    const initialBytes = [];
    for (let i = 0; i < encoded.length; i++) {
      initialBytes.push(encoded.charCodeAt(i) & 255);
    }

    const r1 = this.round1(initialBytes);
    const r2 = this.round2(r1);
    const r3 = this.round3(r2);
    const r4 = this.round4(r3);
    const r5 = this.round5(r4);

    return this.bytesToBase64Url(r5);
  },
};



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
      const path = `/manga/${mangaHash}/chapters`;
      const time = 1;
      const hashToken = ComixHash.generateHash(path, 0, time);

      const chapApi =
        `${apiUrl}manga/${mangaHash}/chapters` +
        `?order[number]=desc&limit=100&page=${page}&time=${time}&_=${encodeURIComponent(hashToken)}`;

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

        let scanlator = "";

if (ch?.scanlation_group?.name) {
  scanlator = String(ch.scanlation_group.name).trim();
} else if (ch?.scanlationGroup?.name) {
  scanlator = String(ch.scanlationGroup.name).trim();
} else if (ch?.is_official === 1 || ch?.is_official === true || ch?.isOfficial === 1 || ch?.isOfficial === true) {
  scanlator = "Official";
}

const item = {
  name,
  url: `${apiUrl}chapters/${chapterId}`,
};

if (dateUpload) item.dateUpload = dateUpload;
if (scanlator) item.scanlator = scanlator;

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

