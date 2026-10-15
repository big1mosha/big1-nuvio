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

// src/discovery/http.js
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
  // Add other common headers like 'Referer' if needed
};
function fetchText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    console.log(`[Template] Fetching: ${url}`);
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

// src/discovery/extractor.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var MAX_TITLE_VARIANTS = 20;
var MOVIE_CATEGORY_URLS = {
  English: "https://cdn4.discoveryftp.net/Movies/English/",
  Animation: "https://cdn1.discoveryftp.net/Movies/Animation/",
  Hindi: "https://cdn1.discoveryftp.net/Movies/Hindi/",
  Bangla: "https://cdn1.discoveryftp.net/Movies/Bangla/",
  Tamil: "https://cdn1.discoveryftp.net/Movies/Tamil/",
  Others: "https://cdn1.discoveryftp.net/Movies/Others/"
};
var TV_CATEGORY_URLS = {
  Foreign: "https://cdn5.discoveryftp.net/Foreign%20Tv%20Series/",
  Animation: "https://cdn5.discoveryftp.net/Animation%20Tv%20Series/",
  Dubbed: "http://cdn2.discoveryftp.net/Dubbed%20Tv%20Series/",
  Hindi: "http://cdn2.discoveryftp.net/Hindi%20Web%20Series/",
  Bangla: "http://cdn2.discoveryftp.net/Bangla%20Web%20Series/",
  Awards: "http://cdn2.discoveryftp.net/Awards%20Tv%20Shows/",
  Documentary: "http://cdn2.discoveryftp.net/Documentry/"
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
    } else {
      return extractMovieStreams(tmdbInfo);
    }
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
function getKeywordSets(tmdbInfo) {
  const seen = /* @__PURE__ */ new Set();
  const sets = [];
  for (const title of [tmdbInfo.title, ...tmdbInfo.altTitles || []]) {
    const clean = String(title || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const words = getKeywords(clean);
    if (words.length) sets.push(words);
    if (sets.length >= MAX_TITLE_VARIANTS) break;
  }
  return sets;
}
function extractMovieStreams(tmdbInfo) {
  return __async(this, null, function* () {
    const titleKeywords = getKeywordSets(tmdbInfo);
    let targetYear = parseInt(tmdbInfo.year, 10);
    if (isNaN(targetYear) || targetYear <= 2e3) {
      targetYear = "2000";
    }
    const searchOrder = getMovieCategorySearchOrder(tmdbInfo.originalLanguage);
    const allStreams = [];
    for (const category of searchOrder) {
      const baseUrl = MOVIE_CATEGORY_URLS[category];
      if (!baseUrl) continue;
      const directoryUrl = `${baseUrl}${targetYear}/`;
      let html;
      try {
        html = yield fetchText(directoryUrl);
      } catch (e) {
        continue;
      }
      const folderPath = findMatchingFolder(html, titleKeywords);
      if (folderPath) {
        const folderUrl = folderPath.startsWith("http") ? folderPath : new URL(folderPath, directoryUrl).href;
        let folderHtml;
        try {
          folderHtml = yield fetchText(folderUrl);
        } catch (e) {
          continue;
        }
        const streams = extractVideoStreams(
          folderHtml,
          folderUrl,
          tmdbInfo.title
        );
        allStreams.push(...streams);
      }
    }
    return allStreams;
  });
}
function extractTvStreams(tmdbInfo, seasonNum, episodeNum) {
  return __async(this, null, function* () {
    const titleKeywords = getKeywordSets(tmdbInfo);
    const searchOrder = getTvCategorySearchOrder(tmdbInfo.originalLanguage);
    const allStreams = [];
    const sPad = String(seasonNum).padStart(2, "0");
    const ePad = String(episodeNum).padStart(2, "0");
    const episodeLabel = `S${sPad}E${ePad}`;
    for (const category of searchOrder) {
      const categoryUrl = TV_CATEGORY_URLS[category];
      if (!categoryUrl) continue;
      let html;
      try {
        html = yield fetchText(categoryUrl);
      } catch (e) {
        continue;
      }
      const showFolderPath = findMatchingFolder(html, titleKeywords);
      if (!showFolderPath) continue;
      const showFolderUrl = showFolderPath.startsWith("http") ? showFolderPath : new URL(showFolderPath, categoryUrl).href;
      let showHtml;
      try {
        showHtml = yield fetchText(showFolderUrl);
      } catch (e) {
        continue;
      }
      const seasonFolderPath = findSeasonFolder(showHtml, seasonNum);
      let targetMediaUrl = showFolderUrl;
      let targetMediaHtml = showHtml;
      if (seasonFolderPath) {
        targetMediaUrl = seasonFolderPath.startsWith("http") ? seasonFolderPath : new URL(seasonFolderPath, showFolderUrl).href;
        try {
          targetMediaHtml = yield fetchText(targetMediaUrl);
        } catch (e) {
          continue;
        }
      }
      const streams = extractEpisodeStreams(
        targetMediaHtml,
        targetMediaUrl,
        seasonNum,
        episodeNum,
        tmdbInfo.title,
        episodeLabel
      );
      if (streams.length > 0) {
        allStreams.push(...streams);
      }
    }
    return allStreams;
  });
}
function findSeasonFolder(html, seasonNum) {
  const $ = import_cheerio_without_node_native.default.load(html);
  const targetSeason = parseInt(seasonNum, 10);
  if (isNaN(targetSeason)) return null;
  let matchedPath = null;
  $("tr").each((_, el) => {
    const row = $(el);
    const linkEl = row.find("a[href]").first();
    const href = linkEl.attr("href") || row.find("td[data-href]").attr("data-href");
    if (!href || href.includes("Parent Directory") || href === "../") return;
    const folderText = decodeURIComponent(linkEl.text() || href).toLowerCase().trim();
    const seasonRegex = new RegExp(
      `season[\\s._-]*0*${targetSeason}\\b|\\bs0*${targetSeason}\\b`,
      "i"
    );
    if (seasonRegex.test(folderText)) {
      matchedPath = href;
      return false;
    }
  });
  return matchedPath;
}
function extractEpisodeStreams(html, baseUrl, seasonNum, episodeNum, displayTitle, episodeLabel = "") {
  const $ = import_cheerio_without_node_native.default.load(html);
  const targetSeason = parseInt(seasonNum, 10);
  const targetEpisode = parseInt(episodeNum, 10);
  const videoFiles = [];
  $("tr").each((_, el) => {
    const row = $(el);
    const linkEl = row.find("a[href]").first();
    let href = linkEl.attr("href") || row.find("td[data-href]").attr("data-href");
    if (!href) return;
    const cleanHref = href.split("?")[0].split("#")[0];
    const isVideo = VIDEO_EXTENSIONS.some(
      (ext) => cleanHref.toLowerCase().endsWith(ext)
    );
    if (!isVideo) return;
    const videoUrl = cleanHref.startsWith("http") ? cleanHref : new URL(cleanHref, baseUrl).href;
    const rawFileName = decodeURIComponent(
      linkEl.text() || cleanHref.split("/").pop()
    );
    videoFiles.push({
      fileName: rawFileName,
      url: videoUrl
    });
  });
  videoFiles.sort(
    (a, b) => a.fileName.localeCompare(b.fileName, void 0, {
      numeric: true,
      sensitivity: "base"
    })
  );
  const matchingStreams = [];
  videoFiles.forEach((file, index) => {
    const name = file.fileName;
    let isMatch = false;
    const sRegex = new RegExp(
      `s0*${targetSeason}[\\s._-]*e0*${targetEpisode}\\b`,
      "i"
    );
    const eRegex = new RegExp(
      `\\b(e|ep|episode)[\\s._-]*0*${targetEpisode}\\b`,
      "i"
    );
    const absoluteNum = targetSeason * 100 + targetEpisode;
    const absRegex = new RegExp(`\\b0*${absoluteNum}\\b`, "i");
    if (sRegex.test(name) || eRegex.test(name) || absRegex.test(name)) {
      isMatch = true;
    } else if (isNaN(targetSeason) && isNaN(targetEpisode)) {
      isMatch = true;
    } else if (videoFiles.length > 1 && index + 1 === targetEpisode) {
      isMatch = true;
    }
    if (isMatch) {
      const formattedShowTitle = episodeLabel ? `${displayTitle} ${episodeLabel}` : displayTitle;
      matchingStreams.push(
        buildStreamObject(file.fileName, file.url, formattedShowTitle)
      );
    }
  });
  return matchingStreams;
}
function getKeywords(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
}
function findMatchingFolder(html, keywordSets) {
  if (!keywordSets || !keywordSets.length) return null;
  const $ = import_cheerio_without_node_native.default.load(html);
  const sets = Array.isArray(keywordSets[0]) ? keywordSets : [keywordSets];
  let matchedPath = null;
  $("tr").each((_, el) => {
    const row = $(el);
    const linkEl = row.find("a[href]").first();
    const href = linkEl.attr("href") || row.find("td[data-href]").attr("data-href");
    if (!href || href.includes("Parent Directory") || href === "../") return;
    const decodedHref = decodeURIComponent(href).toLowerCase();
    const linkText = linkEl.text().toLowerCase();
    const fullContent = `${decodedHref} ${linkText}`;
    const matchesAll = sets.some(
      (words) => words.every((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "i");
        return regex.test(fullContent);
      })
    );
    if (matchesAll) {
      matchedPath = href;
      return false;
    }
  });
  return matchedPath;
}
function extractVideoStreams(html, baseUrl, displayTitle) {
  const $ = import_cheerio_without_node_native.default.load(html);
  const results = [];
  $("tr").each((_, el) => {
    const row = $(el);
    const linkEl = row.find("a[href]").first();
    let href = linkEl.attr("href") || row.find("td[data-href]").attr("data-href");
    if (!href) return;
    const cleanHref = href.split("?")[0].split("#")[0];
    const isVideo = VIDEO_EXTENSIONS.some(
      (ext) => cleanHref.toLowerCase().endsWith(ext)
    );
    if (!isVideo) return;
    const videoUrl = cleanHref.startsWith("http") ? cleanHref : new URL(cleanHref, baseUrl).href;
    const rawFileName = decodeURIComponent(
      linkEl.text() || cleanHref.split("/").pop()
    );
    results.push(buildStreamObject(rawFileName, videoUrl, displayTitle));
  });
  return results;
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
    name: "DiscoveryProvider",
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
function getMovieCategorySearchOrder(originalLang) {
  const langMap = {
    en: ["English", "Animation", "Others"],
    hi: ["Hindi", "Others"],
    bn: ["Bangla", "Others"],
    ta: ["Tamil", "Others"]
  };
  const primaryOrder = langMap[originalLang] || ["English", "Others"];
  return [
    .../* @__PURE__ */ new Set([...primaryOrder, ...Object.keys(MOVIE_CATEGORY_URLS)])
  ].filter((key) => MOVIE_CATEGORY_URLS[key]);
}
function getTvCategorySearchOrder(originalLang) {
  const langMap = {
    en: ["Foreign", "Animation", "Dubbed"],
    hi: ["Hindi", "Dubbed", "Foreign"],
    bn: ["Bangla", "Dubbed"],
    ta: ["Foreign", "Dubbed"]
  };
  const primaryOrder = langMap[originalLang] || ["Foreign", "Dubbed"];
  return [
    .../* @__PURE__ */ new Set([...primaryOrder, ...Object.keys(TV_CATEGORY_URLS)])
  ].filter((key) => TV_CATEGORY_URLS[key]);
}

// src/discovery/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(`[Template] Request: ${mediaType} ${tmdbId}`);
      const streams = yield extractStreams(tmdbId, mediaType, season, episode);
      return streams;
    } catch (error) {
      console.error(`[Template] Error: ${error.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
