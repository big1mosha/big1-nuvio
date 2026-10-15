var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/dhakaflix/http.js
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
  // Add other common headers like 'Referer' if needed
};
function fetchText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    console.log(`[DhakaFlix] Fetching: ${url}`);
    const response = yield fetch(url, __spreadValues({
      headers: __spreadValues(__spreadValues({}, HEADERS), options.headers)
    }, options));
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} for ${url}`);
    }
    return yield response.text();
  });
}
function fetchJson(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const raw = yield fetchText(url, options);
    return JSON.parse(raw);
  });
}

// src/dhakaflix/extractor.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var PROVIDER_NAME = "DhakaFlix";
var MAX_TITLE_VARIANTS = 20;
var MAX_DEPTH = 3;
var CATEGORY_FETCH_BUDGET = 16;
var MAX_CANDIDATES = 4;
var MAX_SUBDIRS = 12;
var MAX_TV_YEAR_FOLDERS = 8;
var MOVIE_CATEGORY_URLS = {
  English: "http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/",
  English1080p: "http://172.16.50.14/DHAKA-FLIX-14/English%20Movies%20%281080p%29/",
  Hindi: "http://172.16.50.14/DHAKA-FLIX-14/Hindi%20Movies/",
  South: "http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/",
  SouthDubbed: "http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/Hindi%20Dubbed/",
  Bangla: "http://172.16.50.7/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/",
  Animation: "http://172.16.50.14/DHAKA-FLIX-14/Animation%20Movies/",
  Animation1080p: "http://172.16.50.14/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/",
  Foreign: "http://172.16.50.7/DHAKA-FLIX-7/Foreign%20Language%20Movies/",
  IMDbTop250: "http://172.16.50.14/DHAKA-FLIX-14/IMDb%20Top-250%20Movies/",
  "3D": "http://172.16.50.7/DHAKA-FLIX-7/3D%20Movies/"
};
var TV_CATEGORY_URLS = {
  TVWEB: "http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/",
  Korean: "http://172.16.50.14/DHAKA-FLIX-14/KOREAN%20TV%20%26%20WEB%20Series/",
  Cartoon: "http://172.16.50.10/DHAKA-FLIX-10/Anime%20%26%20Cartoon%20TV%20Series/",
  Documentary: "http://172.16.50.10/DHAKA-FLIX-10/Documentary/",
  Awards: "http://172.16.50.10/DHAKA-FLIX-10/Awards%20%26%20TV%20Shows/",
  Wrestling: "http://172.16.50.10/DHAKA-FLIX-10/WWE%20%26%20AEW%20Wrestling/"
};
var MOVIE_CATEGORY_FAMILIES = {
  en: [
    ["English", "English1080p"],
    ["3D", "IMDbTop250"],
    ["Animation", "Animation1080p"],
    ["Foreign"],
    ["Hindi", "South", "SouthDubbed"],
    ["Bangla"]
  ],
  hi: [
    ["Hindi", "South", "SouthDubbed"],
    ["English", "English1080p"],
    ["Foreign"],
    ["Bangla"],
    ["Animation", "Animation1080p"],
    ["3D", "IMDbTop250"]
  ],
  bn: [
    ["Bangla", "Foreign"],
    ["Hindi", "South", "SouthDubbed"],
    ["English", "English1080p"],
    ["Animation", "Animation1080p"],
    ["3D", "IMDbTop250"]
  ],
  ta: [
    ["South", "SouthDubbed"],
    ["Hindi"],
    ["Foreign"],
    ["English", "English1080p"],
    ["Bangla"],
    ["Animation", "Animation1080p"],
    ["3D", "IMDbTop250"]
  ],
  ja: [
    ["Animation", "Animation1080p", "Foreign"],
    ["English", "English1080p"],
    ["Hindi", "South", "SouthDubbed"],
    ["3D", "IMDbTop250"]
  ]
};
var DEFAULT_MOVIE_FAMILIES = [
  ["English", "English1080p"],
  ["Hindi", "South", "SouthDubbed"],
  ["Animation", "Animation1080p"],
  ["Foreign"],
  ["Bangla"],
  ["3D", "IMDbTop250"]
];
var TV_CATEGORY_FAMILIES = {
  en: [
    ["TVWEB"],
    ["Documentary"],
    ["Awards"],
    ["Cartoon"],
    ["Korean"],
    ["Wrestling"]
  ],
  ko: [
    ["Korean"],
    ["TVWEB"],
    ["Cartoon"],
    ["Documentary"],
    ["Awards"],
    ["Wrestling"]
  ],
  ja: [
    ["Cartoon"],
    ["TVWEB"],
    ["Korean"],
    ["Documentary"],
    ["Awards"],
    ["Wrestling"]
  ]
};
var DEFAULT_TV_FAMILIES = [
  ["TVWEB"],
  ["Korean"],
  ["Cartoon"],
  ["Documentary"],
  ["Awards"],
  ["Wrestling"]
];
var FOREIGN_LANGUAGE_HINTS = {
  bn: "bangla",
  pt: "brazil",
  zh: "chinese",
  da: "danish",
  nl: "dutch",
  fr: "french",
  de: "german",
  id: "indonesian",
  fa: "iranian",
  it: "italian",
  ja: "japanese",
  ko: "korean",
  no: "norwegian",
  pl: "polish",
  ru: "russian",
  es: "spanish",
  sv: "swedish",
  th: "thai",
  tr: "turkish",
  ur: "pakistani"
};
var VIDEO_EXTENSIONS = [
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".webm",
  ".flv",
  ".m4v",
  ".ts",
  ".wmv"
];
function extractStreams(tmdbId, mediaType = "movie", season, episode) {
  return __async(this, null, function* () {
    const sNum = season !== void 0 ? season : 1;
    const eNum = episode !== void 0 ? episode : 1;
    const tmdbInfo = yield getTmdbInfo(tmdbId, mediaType, sNum, eNum);
    if (!tmdbInfo || !tmdbInfo.title) {
      return [];
    }
    if (mediaType === "tv") {
      return extractTvStreams(tmdbInfo, sNum, eNum);
    }
    return extractMovieStreams(tmdbInfo);
  });
}
function getTmdbInfo(tmdbId, mediaType = "movie", season, episode) {
  return __async(this, null, function* () {
    try {
      const raw = String(tmdbId || "").trim();
      const data = isImdbId(raw) ? yield resolveByImdb(raw, mediaType) : yield fetchJson(
        `https://api.themoviedb.org/3/${mediaType}/${raw}?api_key=${TMDB_API_KEY}`
      );
      if (!data) return null;
      return {
        title: data.title || data.name || "",
        altTitles: yield getAlternativeTitles(data.id, mediaType),
        year: (data.release_date || data.first_air_date || data.air_date || "").split("-")[0],
        originalLanguage: data.original_language || "",
        overview: data.overview || ""
      };
    } catch (error) {
      return null;
    }
  });
}
function isImdbId(id) {
  return /^tt\d+/i.test(id);
}
function resolveByImdb(imdbId, mediaType) {
  return __async(this, null, function* () {
    const found = yield fetchJson(
      `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
    );
    const primary = mediaType === "tv" ? found.tv_results : found.movie_results;
    const secondary = mediaType === "tv" ? found.movie_results : found.tv_results;
    return primary && primary[0] || secondary && secondary[0] || null;
  });
}
function getAlternativeTitles(id, mediaType) {
  return __async(this, null, function* () {
    if (!id) return [];
    try {
      const data = yield fetchJson(
        `https://api.themoviedb.org/3/${mediaType}/${id}/alternative_titles?api_key=${TMDB_API_KEY}`
      );
      const list = data.titles || data.results || [];
      return list.map((entry) => entry.title || entry.name || "").filter(Boolean);
    } catch (error) {
      return [];
    }
  });
}
function buildTitleVariants(primary, alternatives) {
  const seen = /* @__PURE__ */ new Set();
  const variants = [];
  for (const title of [primary, ...alternatives || []]) {
    const clean = String(title || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    variants.push(clean);
    if (variants.length >= MAX_TITLE_VARIANTS) break;
  }
  return variants;
}
function buildContext(kind, tmdbInfo, extra = {}) {
  const titles = buildTitleVariants(tmdbInfo.title, tmdbInfo.altTitles);
  return __spreadValues({
    kind,
    title: tmdbInfo.title,
    titles,
    keywordSets: titles.map(getKeywords).filter((words) => words.length),
    keywords: getKeywords(tmdbInfo.title),
    year: parseInt(tmdbInfo.year, 10) || null,
    hint: FOREIGN_LANGUAGE_HINTS[tmdbInfo.originalLanguage] || ""
  }, extra);
}
function extractMovieStreams(tmdbInfo) {
  return __async(this, null, function* () {
    const ctx = buildContext("movie", tmdbInfo);
    const families = buildFamilies(
      MOVIE_CATEGORY_URLS,
      MOVIE_CATEGORY_FAMILIES[tmdbInfo.originalLanguage] || DEFAULT_MOVIE_FAMILIES
    );
    const allStreams = [];
    for (const family of families) {
      for (const category of family) {
        const streams = yield searchMovieCategory(
          MOVIE_CATEGORY_URLS[category],
          ctx
        );
        allStreams.push(...streams);
      }
      if (allStreams.length > 0) break;
    }
    return allStreams;
  });
}
function searchMovieCategory(categoryUrl, ctx) {
  return __async(this, null, function* () {
    const folder = yield findMediaFolder(categoryUrl, ctx, {
      depth: 0,
      budget: { left: CATEGORY_FETCH_BUDGET }
    });
    if (!folder) return [];
    return extractVideoStreamsFromRows(folder.rows, folder.url, ctx.title);
  });
}
function extractTvStreams(tmdbInfo, seasonNum, episodeNum) {
  return __async(this, null, function* () {
    const sPad = String(seasonNum).padStart(2, "0");
    const ePad = String(episodeNum).padStart(2, "0");
    const ctx = buildContext("tv", tmdbInfo, {
      season: seasonNum,
      episode: episodeNum,
      episodeLabel: `S${sPad}E${ePad}`
    });
    const families = buildFamilies(
      TV_CATEGORY_URLS,
      TV_CATEGORY_FAMILIES[tmdbInfo.originalLanguage] || DEFAULT_TV_FAMILIES
    );
    const allStreams = [];
    for (const family of families) {
      for (const category of family) {
        const streams = yield searchTvCategory(
          TV_CATEGORY_URLS[category],
          ctx
        );
        allStreams.push(...streams);
      }
      if (allStreams.length > 0) break;
    }
    return allStreams;
  });
}
function searchTvCategory(categoryUrl, ctx) {
  return __async(this, null, function* () {
    const show = yield findMediaFolder(categoryUrl, ctx, {
      depth: 0,
      budget: { left: CATEGORY_FETCH_BUDGET }
    });
    if (!show) return [];
    const seasonRow = findSeasonRow(show.rows, ctx.season);
    let target = show;
    if (seasonRow) {
      const rows = yield fetchRows(seasonRow.url);
      if (rows) target = { url: seasonRow.url, rows };
    }
    return extractEpisodeStreamsFromRows(
      target.rows,
      target.url,
      ctx
    );
  });
}
function findSeasonRow(rows, seasonNum) {
  const targetSeason = parseInt(seasonNum, 10);
  if (isNaN(targetSeason)) return null;
  const seasonRegex = new RegExp(
    `season[\\s._-]*0*${targetSeason}\\b|\\bs0*${targetSeason}\\b`,
    "i"
  );
  return rows.find((row) => seasonRegex.test(row.label)) || null;
}
function findMediaFolder(dirUrl, ctx, state) {
  return __async(this, null, function* () {
    if (state.depth > MAX_DEPTH || state.budget.left <= 0) return null;
    const rows = yield fetchRows(dirUrl);
    if (!rows) return null;
    state.budget.left -= 1;
    const match = pickBestMatch(rows, ctx);
    if (match) {
      const subRows = yield fetchRows(match.url);
      state.budget.left -= 1;
      if (!subRows) return null;
      const hasVideos = subRows.some((row) => row.isVideo);
      if (hasVideos || ctx.kind === "tv") {
        return { url: match.url, rows: subRows };
      }
      const deeper = yield findMediaFolder(match.url, ctx, {
        depth: state.depth + 1,
        budget: state.budget
      });
      return deeper || { url: match.url, rows: subRows };
    }
    const candidates = pickCandidateDirs(rows, ctx);
    for (const candidate of candidates) {
      if (state.budget.left <= 0) break;
      if (matchesTitle(candidate, ctx)) {
        const candidateRows = yield fetchRows(candidate.url);
        state.budget.left -= 1;
        if (candidateRows) {
          return { url: candidate.url, rows: candidateRows };
        }
        continue;
      }
      const found = yield findMediaFolder(candidate.url, ctx, {
        depth: state.depth + 1,
        budget: state.budget
      });
      if (found) return found;
    }
    return null;
  });
}
function textVariants(row) {
  const raw = `${row.href.toLowerCase()} ${row.label.toLowerCase()}`;
  return [
    raw,
    raw.replace(/[^a-z0-9 ]/g, ""),
    raw.replace(/['"’‘“”:]/g, "").replace(/[^a-z0-9]+/g, " ")
  ];
}
function matchesTitle(row, ctx) {
  const sets = ctx.keywordSets && ctx.keywordSets.length ? ctx.keywordSets : [ctx.keywords];
  if (!sets.length) return false;
  const haystacks = textVariants(row);
  return sets.some(
    (words) => words.every(
      (word) => haystacks.some((text) => new RegExp(`\\b${word}\\b`, "i").test(text))
    )
  );
}
function pickBestMatch(rows, ctx) {
  if (!ctx.keywords.length) return null;
  const anyYearRegex = /(19|20)\d{2}/;
  const yearRegex = ctx.year ? new RegExp(`\\b${ctx.year}\\b`) : null;
  const matches = [];
  for (const row of rows) {
    if (row.isVideo || !row.isDir) continue;
    if (!matchesTitle(row, ctx)) continue;
    const haystacks = textVariants(row);
    const yearHit = yearRegex ? haystacks.some((t) => yearRegex.test(t)) : false;
    if (ctx.year && ctx.kind === "movie" && !yearHit && anyYearRegex.test(haystacks[0])) {
      continue;
    }
    matches.push({ row, yearHit });
  }
  if (!matches.length) return null;
  const withYear = matches.find((entry) => entry.yearHit);
  return (withYear || matches[0]).row;
}
function pickCandidateDirs(rows, ctx) {
  const dirs = rows.filter((row) => !row.isVideo && row.isDir);
  if (!dirs.length) return [];
  if (ctx.year && looksLikeYearLevel(dirs)) {
    const widen = ctx.kind === "tv";
    const limit = widen ? MAX_TV_YEAR_FOLDERS : MAX_CANDIDATES;
    const keywordHits = dirs.filter(
      (dir) => ctx.keywords.some(
        (word) => new RegExp(`\\b${word}\\b`, "i").test(
          `${dir.href} ${dir.label}`.toLowerCase()
        )
      )
    );
    const seen = /* @__PURE__ */ new Set();
    return [...keywordHits, ...pickYearFolders(dirs, ctx.year, widen)].filter((dir) => {
      if (seen.has(dir.url)) return false;
      seen.add(dir.url);
      return true;
    }).slice(0, limit);
  }
  const buckets = pickBucketFolders(dirs, ctx.keywords[0]);
  if (buckets.length) return buckets.slice(0, MAX_CANDIDATES);
  if (looksLikeMediaLevel(dirs)) return [];
  const ordered = ctx.hint ? [
    ...dirs.filter(
      (dir) => dir.label.toLowerCase().includes(ctx.hint)
    ),
    ...dirs.filter(
      (dir) => !dir.label.toLowerCase().includes(ctx.hint)
    )
  ] : dirs;
  return ordered.slice(0, MAX_SUBDIRS);
}
function looksLikeMediaLevel(dirs) {
  const titled = dirs.filter(
    (dir) => /(19|20)\d{2}/.test(dir.label) || /\((tv|web)?\s*(mini\s*)?(series|cartoon|documentary|movie)/i.test(
      dir.label
    )
  ).length;
  return dirs.length > 40 || titled >= dirs.length * 0.5;
}
function looksLikeYearLevel(dirs) {
  const hits = dirs.filter(
    (dir) => /^\s*[(\[]?\s*(19|20)\d{2}\b/.test(dir.label)
  ).length;
  return hits > 0 && hits >= dirs.length * 0.6;
}
function pickYearFolders(dirs, year, widen = false) {
  const parsed = dirs.map((row) => ({ row, info: parseYearInfo(row.label) })).filter((entry) => entry.info);
  const exact = parsed.filter((entry) => entry.info.exact === year);
  const before = parsed.filter(
    (entry) => entry.info.before !== void 0 && year <= entry.info.before
  ).sort((a, b) => a.info.before - b.info.before);
  const ranges = parsed.filter(
    (entry) => entry.info.range && year >= entry.info.range[0] && year <= entry.info.range[1]
  );
  const singles = parsed.filter((entry) => entry.info.exact !== void 0).map((entry) => entry.info.exact);
  const below = singles.filter((value) => value < year).sort((a, b) => b - a)[0];
  const above = singles.filter((value) => value > year).sort((a, b) => a - b)[0];
  const ordered = [...exact, ...before, ...ranges];
  if (below !== void 0) {
    ordered.push(...parsed.filter((entry) => entry.info.exact === below));
  }
  if (above !== void 0) {
    ordered.push(...parsed.filter((entry) => entry.info.exact === above));
  }
  if (widen) {
    const seenYears = new Set(
      ordered.map((entry) => entry.info.exact).filter((value) => value !== void 0)
    );
    const rest = [...singles].filter((value) => !seenYears.has(value)).sort((a, b) => Math.abs(a - year) - Math.abs(b - year));
    for (const value of rest) {
      ordered.push(...parsed.filter((entry) => entry.info.exact === value));
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return ordered.map((entry) => entry.row).filter((row) => {
    if (seen.has(row.url)) return false;
    seen.add(row.url);
    return true;
  });
}
function parseYearInfo(label) {
  const text = label.toLowerCase();
  const years = [...text.matchAll(/(19|20)\d{2}/g)].map(
    (m) => parseInt(m[0], 10)
  );
  if (!years.length) return null;
  if (/before|older|earlier/.test(text)) {
    return { before: Math.max(...years) };
  }
  if (years.length >= 2) {
    return { range: [Math.min(...years), Math.max(...years)] };
  }
  return { exact: years[0] };
}
function pickBucketFolders(dirs, firstChar) {
  const parsed = [];
  for (const row of dirs) {
    const match = row.label.match(
      /([A-Za-z0-9])\s*[—–-]\s*([A-Za-z0-9])\s*$/
    );
    if (!match) continue;
    parsed.push({
      row,
      from: match[1].toUpperCase(),
      to: match[2].toUpperCase()
    });
  }
  if (!parsed.length) return [];
  const target = (firstChar || "").slice(0, 1).toUpperCase();
  const hit = parsed.find((entry) => isInBucket(target, entry));
  const ordered = [];
  if (hit) ordered.push(hit.row);
  for (const entry of parsed) {
    if (entry !== hit) ordered.push(entry.row);
  }
  return ordered;
}
function isInBucket(char, bucket) {
  if (!char || !/[A-Z0-9]/.test(char)) return false;
  const digitBuckets = /[0-9]/.test(bucket.from) && /[0-9]/.test(bucket.to);
  if (digitBuckets) {
    return /[0-9]/.test(char) && char >= bucket.from && char <= bucket.to;
  }
  if (/[0-9]/.test(bucket.from) || /[0-9]/.test(bucket.to)) return false;
  return char >= bucket.from && char <= bucket.to;
}
function fetchRows(url) {
  return __async(this, null, function* () {
    try {
      const html = yield fetchText(url);
      return parseRows(html, url);
    } catch (error) {
      return null;
    }
  });
}
function parseRows(html, baseUrl) {
  const $ = import_cheerio_without_node_native.default.load(html);
  const rows = [];
  $("tr").each((_, el) => {
    const row = $(el);
    const linkEl = row.find("a[href]").first();
    const href = linkEl.attr("href") || row.find("td[data-href]").attr("data-href");
    if (!href || href.includes("Parent Directory") || href === "../") return;
    const cleanHref = href.split("?")[0].split("#")[0];
    const url = cleanHref.startsWith("http") ? cleanHref : new URL(cleanHref, baseUrl).href;
    if (isAncestorOrSelf(url, baseUrl)) return;
    let label;
    try {
      label = decodeURIComponent(linkEl.text() || cleanHref.split("/").pop());
    } catch (error) {
      label = linkEl.text() || cleanHref;
    }
    const isVideo = VIDEO_EXTENSIONS.some(
      (ext) => cleanHref.toLowerCase().endsWith(ext)
    );
    const isDir = !isVideo && (cleanHref.endsWith("/") || !/\.[a-z0-9]{2,5}$/i.test(cleanHref));
    rows.push({ label, href: cleanHref, url, isVideo, isDir });
  });
  return rows;
}
function isAncestorOrSelf(url, baseUrl) {
  if (url === baseUrl) return true;
  try {
    const target = new URL(url);
    const base = new URL(baseUrl);
    if (target.origin !== base.origin) return false;
    if (!target.pathname.endsWith("/")) return false;
    return [base.pathname, safeDecode(base.pathname)].some(
      (basePath) => [target.pathname, safeDecode(target.pathname)].some(
        (targetPath) => basePath.startsWith(targetPath)
      )
    );
  } catch (error) {
    return false;
  }
}
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}
function extractVideoStreamsFromRows(rows, baseUrl, displayTitle) {
  return rows.filter((row) => row.isVideo).map(
    (row) => buildStreamObject(row.label, resolveUrl(row, baseUrl), displayTitle)
  );
}
var EPISODE_NOISE = [
  /\[[^\]]*\]/g,
  /\([^)]*\)/g,
  /\b\d{3,4}p\b/gi,
  /\b\d+\.\d+\b/g,
  /\b(?:x265|x264|h265|h264|hevc|avc|aac|ac3|eac3|ddp\d*|dd\d*|dts|atmos|remux|bluray|brrip|bdrip|web-?dl|webrip|hdrip|hdtv|dsnp|hmax|nf|amzn|esub|esubs|dual|multi|hdhub|msmod)\b/gi
];
function denoiseFileName(name) {
  return EPISODE_NOISE.reduce(
    (text, pattern) => text.replace(pattern, " "),
    name
  );
}
function extractEpisodeStreamsFromRows(rows, baseUrl, ctx) {
  const targetSeason = parseInt(ctx.season, 10);
  const targetEpisode = parseInt(ctx.episode, 10);
  const videoFiles = rows.filter((row) => row.isVideo).map((row) => ({
    fileName: row.label,
    url: resolveUrl(row, baseUrl)
  }));
  videoFiles.sort(
    (a, b) => a.fileName.localeCompare(b.fileName, void 0, {
      numeric: true,
      sensitivity: "base"
    })
  );
  if (isNaN(targetSeason) && isNaN(targetEpisode)) {
    return videoFiles.map(
      (file) => buildStreamObject(file.fileName, file.url, ctx.title)
    );
  }
  const strongMatches = [];
  const softMatches = [];
  const sRegex = new RegExp(
    `s0*${targetSeason}[\\s._-]*e0*${targetEpisode}\\b`,
    "i"
  );
  const xRegex = new RegExp(`\\b${targetSeason}x0*${targetEpisode}\\b`, "i");
  const eRegex = new RegExp(
    `\\b(e|ep|episode)[\\s._-]*0*${targetEpisode}\\b`,
    "i"
  );
  const absoluteNum = targetSeason * 100 + targetEpisode;
  const absRegex = new RegExp(`\\b0*${absoluteNum}\\b`, "i");
  const bareRegex = new RegExp(`(^|[\\s._-])0*${targetEpisode}(?=[\\s._-]|$)`);
  for (const file of videoFiles) {
    const clean = denoiseFileName(file.fileName);
    if (sRegex.test(clean) || xRegex.test(clean) || eRegex.test(clean)) {
      strongMatches.push(file);
    } else if (absRegex.test(clean) || bareRegex.test(clean)) {
      softMatches.push(file);
    }
  }
  const matched = strongMatches.length ? strongMatches : softMatches;
  if (matched.length) {
    return matched.map(
      (file) => buildStreamObject(file.fileName, file.url, episodeTitle(ctx))
    );
  }
  if (videoFiles.length > 1 && videoFiles[targetEpisode - 1]) {
    const file = videoFiles[targetEpisode - 1];
    return [buildStreamObject(file.fileName, file.url, episodeTitle(ctx))];
  }
  if (videoFiles.length === 1) {
    return [
      buildStreamObject(
        videoFiles[0].fileName,
        videoFiles[0].url,
        ctx.title
      )
    ];
  }
  return [];
}
function episodeTitle(ctx) {
  return ctx.episodeLabel ? `${ctx.title} ${ctx.episodeLabel}` : ctx.title;
}
function resolveUrl(row, baseUrl) {
  return row.href.startsWith("http") ? row.href : new URL(row.href, baseUrl).href;
}
function buildStreamObject(rawFileName, videoUrl, displayTitle = "") {
  let quality = "480p";
  if (/2160p|4k/i.test(rawFileName)) quality = "2160p";
  else if (/1080p/i.test(rawFileName)) quality = "1080p";
  else if (/720p/i.test(rawFileName)) quality = "720p";
  const tags = [];
  if (isDualAudio(rawFileName)) tags.push("Dual Audio");
  if (/repack/i.test(rawFileName)) tags.push("REPACK");
  if (/bluray|brrip/i.test(rawFileName)) tags.push("BluRay");
  if (/web-dl|webrip|hmax|dsnp|nf/i.test(rawFileName)) tags.push("WEB-DL");
  if (/x265|hevc/i.test(rawFileName)) tags.push("HEVC");
  const tagString = tags.length > 0 ? ` [${tags.join(" \u2022 ")}]` : "";
  const titlePrefix = displayTitle ? `${displayTitle} \u2022 ` : "";
  return {
    name: PROVIDER_NAME,
    title: `${titlePrefix}${quality}${tagString}`,
    url: videoUrl,
    quality,
    headers: HEADERS
  };
}
function isDualAudio(text) {
  if (/dual|multi|dual-audio|multi-audio/i.test(text)) return true;
  const languages = [
    "english",
    "hindi",
    "bangla",
    "tamil",
    "telugu",
    "dual",
    "eng",
    "hin",
    "tam",
    "org ddp",
    "ddp"
  ];
  const foundLangs = languages.filter(
    (lang) => text.toLowerCase().includes(lang)
  );
  return foundLangs.length >= 2;
}
function getKeywords(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
}
function buildFamilies(categoryMap, preferredFamilies) {
  const families = [];
  const used = /* @__PURE__ */ new Set();
  for (const family of preferredFamilies) {
    const valid = family.filter((key) => {
      if (!categoryMap[key] || used.has(key)) return false;
      used.add(key);
      return true;
    });
    if (valid.length) families.push(valid);
  }
  for (const key of Object.keys(categoryMap)) {
    if (!used.has(key)) families.push([key]);
  }
  return families;
}

// src/dhakaflix/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(`[DhakaFlix] Request: ${mediaType} ${tmdbId}`);
      const streams = yield extractStreams(tmdbId, mediaType, season, episode);
      return streams;
    } catch (error) {
      console.error(`[DhakaFlix] Error: ${error.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
