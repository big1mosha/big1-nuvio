import { fetchText, fetchJson, HEADERS } from "./http.js";
import cheerio from "cheerio-without-node-native";

const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";

// Base URLs for Movie categories
const MOVIE_CATEGORY_URLS = {
    English: "https://cdn4.discoveryftp.net/Movies/English/",
    Animation: "https://cdn1.discoveryftp.net/Movies/Animation/",
    Hindi: "https://cdn1.discoveryftp.net/Movies/Hindi/",
    Bangla: "https://cdn1.discoveryftp.net/Movies/Bangla/",
    Tamil: "https://cdn1.discoveryftp.net/Movies/Tamil/",
    Others: "https://cdn1.discoveryftp.net/Movies/Others/",
};

// Base URLs for TV Series categories
const TV_CATEGORY_URLS = {
    Foreign: "https://cdn5.discoveryftp.net/Foreign%20Tv%20Series/",
    Animation: "https://cdn5.discoveryftp.net/Animation%20Tv%20Series/",
    Dubbed: "http://cdn2.discoveryftp.net/Dubbed%20Tv%20Series/",
    Hindi: "http://cdn2.discoveryftp.net/Hindi%20Web%20Series/",
    Bangla: "http://cdn2.discoveryftp.net/Bangla%20Web%20Series/",
    Awards: "http://cdn2.discoveryftp.net/Awards%20Tv%20Shows/",
    Documentary: "http://cdn2.discoveryftp.net/Documentry/",
};

const VIDEO_EXTENSIONS = [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".webm",
    ".flv",
    ".m4v",
    ".ts",
    ".wmv",
];

/**
 * Main stream extraction router for Nuvio.
 */
export async function extractStreams(
    tmdbId,
    mediaType = "movie",
    season,
    episode,
) {
    const sNum = season !== undefined ? season : 1;
    const eNum = episode !== undefined ? episode : 1;

    const tmdbInfo = await getTmdbInfo(tmdbId, mediaType, sNum, eNum);
    if (!tmdbInfo || !tmdbInfo.title) {
        return [];
    }

    if (mediaType === "tv") {
        return extractTvStreams(tmdbInfo, sNum, eNum);
    } else {
        return extractMovieStreams(tmdbInfo);
    }
}

/**
 * Fetches media details from TMDB.
 */
export async function getTmdbInfo(
    tmdbId,
    mediaType = "movie",
    season,
    episode,
) {
    const endpoint = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`;

    try {
        const data = await fetchJson(endpoint);
        return {
            title: data.title || data.name || "",
            year: (
                data.release_date ||
                data.first_air_date ||
                data.air_date ||
                ""
            ).split("-")[0],
            originalLanguage: data.original_language || "",
            overview: data.overview || "",
        };
    } catch (error) {
        return null;
    }
}

/* ==========================================================================
   MOVIE EXTRACTION LOGIC
   ========================================================================== */

async function extractMovieStreams(tmdbInfo) {
    const titleKeywords = getKeywords(tmdbInfo.title);

    let targetYear = parseInt(tmdbInfo.year, 10);
    if (isNaN(targetYear) || targetYear <= 2000) {
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
            html = await fetchText(directoryUrl);
        } catch (e) {
            continue;
        }

        const folderPath = findMatchingFolder(html, titleKeywords);

        if (folderPath) {
            const folderUrl = folderPath.startsWith("http")
                ? folderPath
                : new URL(folderPath, directoryUrl).href;

            let folderHtml;
            try {
                folderHtml = await fetchText(folderUrl);
            } catch (e) {
                continue;
            }

            const streams = extractVideoStreams(
                folderHtml,
                folderUrl,
                tmdbInfo.title,
            );
            allStreams.push(...streams);
        }
    }

    return allStreams;
}

/* ==========================================================================
   TV SERIES EXTRACTION LOGIC
   ========================================================================== */

async function extractTvStreams(tmdbInfo, seasonNum, episodeNum) {
    const titleKeywords = getKeywords(tmdbInfo.title);
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
            html = await fetchText(categoryUrl);
        } catch (e) {
            continue;
        }

        const showFolderPath = findMatchingFolder(html, titleKeywords);
        if (!showFolderPath) continue;

        const showFolderUrl = showFolderPath.startsWith("http")
            ? showFolderPath
            : new URL(showFolderPath, categoryUrl).href;

        let showHtml;
        try {
            showHtml = await fetchText(showFolderUrl);
        } catch (e) {
            continue;
        }

        const seasonFolderPath = findSeasonFolder(showHtml, seasonNum);
        let targetMediaUrl = showFolderUrl;
        let targetMediaHtml = showHtml;

        if (seasonFolderPath) {
            targetMediaUrl = seasonFolderPath.startsWith("http")
                ? seasonFolderPath
                : new URL(seasonFolderPath, showFolderUrl).href;

            try {
                targetMediaHtml = await fetchText(targetMediaUrl);
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
            episodeLabel,
        );

        if (streams.length > 0) {
            allStreams.push(...streams);
        }
    }

    return allStreams;
}

/**
 * Locates matching Season directory.
 */
function findSeasonFolder(html, seasonNum) {
    const $ = cheerio.load(html);
    const targetSeason = parseInt(seasonNum, 10);
    if (isNaN(targetSeason)) return null;

    let matchedPath = null;

    $("tr").each((_, el) => {
        const row = $(el);
        const linkEl = row.find("a[href]").first();
        const href =
            linkEl.attr("href") || row.find("td[data-href]").attr("data-href");

        if (!href || href.includes("Parent Directory") || href === "../") return;

        const folderText = decodeURIComponent(linkEl.text() || href)
            .toLowerCase()
            .trim();

        const seasonRegex = new RegExp(
            `season[\\s._-]*0*${targetSeason}\\b|\\bs0*${targetSeason}\\b`,
            "i",
        );

        if (seasonRegex.test(folderText)) {
            matchedPath = href;
            return false;
        }
    });

    return matchedPath;
}

/**
 * Extracts video files from HTML and filters for the target episode.
 */
function extractEpisodeStreams(
    html,
    baseUrl,
    seasonNum,
    episodeNum,
    displayTitle,
    episodeLabel = "",
) {
    const $ = cheerio.load(html);
    const targetSeason = parseInt(seasonNum, 10);
    const targetEpisode = parseInt(episodeNum, 10);

    const videoFiles = [];

    $("tr").each((_, el) => {
        const row = $(el);
        const linkEl = row.find("a[href]").first();
        let href =
            linkEl.attr("href") || row.find("td[data-href]").attr("data-href");

        if (!href) return;

        const cleanHref = href.split("?")[0].split("#")[0];
        const isVideo = VIDEO_EXTENSIONS.some((ext) =>
            cleanHref.toLowerCase().endsWith(ext),
        );
        if (!isVideo) return;

        const videoUrl = cleanHref.startsWith("http")
            ? cleanHref
            : new URL(cleanHref, baseUrl).href;

        const rawFileName = decodeURIComponent(
            linkEl.text() || cleanHref.split("/").pop(),
        );

        videoFiles.push({
            fileName: rawFileName,
            url: videoUrl,
        });
    });

    videoFiles.sort((a, b) =>
        a.fileName.localeCompare(b.fileName, undefined, {
            numeric: true,
            sensitivity: "base",
        }),
    );

    const matchingStreams = [];

    videoFiles.forEach((file, index) => {
        const name = file.fileName;
        let isMatch = false;

        const sRegex = new RegExp(
            `s0*${targetSeason}[\\s._-]*e0*${targetEpisode}\\b`,
            "i",
        );

        const eRegex = new RegExp(
            `\\b(e|ep|episode)[\\s._-]*0*${targetEpisode}\\b`,
            "i",
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
            const formattedShowTitle = episodeLabel
                ? `${displayTitle} ${episodeLabel}`
                : displayTitle;

            matchingStreams.push(
                buildStreamObject(file.fileName, file.url, formattedShowTitle),
            );
        }
    });

    return matchingStreams;
}

/* ==========================================================================
   COMMON HELPER UTILITIES
   ========================================================================== */

function getKeywords(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean);
}

function findMatchingFolder(html, titleKeywords) {
    const $ = cheerio.load(html);
    let matchedPath = null;

    $("tr").each((_, el) => {
        const row = $(el);
        const linkEl = row.find("a[href]").first();
        const href =
            linkEl.attr("href") || row.find("td[data-href]").attr("data-href");

        if (!href || href.includes("Parent Directory") || href === "../") return;

        const decodedHref = decodeURIComponent(href).toLowerCase();
        const linkText = linkEl.text().toLowerCase();
        const fullContent = `${decodedHref} ${linkText}`;

        const matchesAll = titleKeywords.every((word) => {
            const regex = new RegExp(`\\b${word}\\b`, "i");
            return regex.test(fullContent);
        });

        if (matchesAll) {
            matchedPath = href;
            return false;
        }
    });

    return matchedPath;
}

function extractVideoStreams(html, baseUrl, displayTitle) {
    const $ = cheerio.load(html);
    const results = [];

    $("tr").each((_, el) => {
        const row = $(el);
        const linkEl = row.find("a[href]").first();
        let href =
            linkEl.attr("href") || row.find("td[data-href]").attr("data-href");

        if (!href) return;

        const cleanHref = href.split("?")[0].split("#")[0];
        const isVideo = VIDEO_EXTENSIONS.some((ext) =>
            cleanHref.toLowerCase().endsWith(ext),
        );
        if (!isVideo) return;

        const videoUrl = cleanHref.startsWith("http")
            ? cleanHref
            : new URL(cleanHref, baseUrl).href;

        const rawFileName = decodeURIComponent(
            linkEl.text() || cleanHref.split("/").pop(),
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

    const tagString = tags.length > 0 ? ` [${tags.join(" • ")}]` : "";
    const titlePrefix = displayTitle ? `${displayTitle} • ` : "";

    return {
        name: "DiscoveryProvider",
        title: `${titlePrefix}${quality}${tagString}`,
        url: videoUrl,
        quality: quality,
        headers: HEADERS,
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
        "ddp",
    ];
    const foundLangs = languages.filter((lang) =>
        text.toLowerCase().includes(lang),
    );
    return foundLangs.length >= 2;
}

function getMovieCategorySearchOrder(originalLang) {
    const langMap = {
        en: ["English", "Animation", "Others"],
        hi: ["Hindi", "Others"],
        bn: ["Bangla", "Others"],
        ta: ["Tamil", "Others"],
    };
    const primaryOrder = langMap[originalLang] || ["English", "Others"];
    return [
        ...new Set([...primaryOrder, ...Object.keys(MOVIE_CATEGORY_URLS)]),
    ].filter((key) => MOVIE_CATEGORY_URLS[key]);
}

function getTvCategorySearchOrder(originalLang) {
    const langMap = {
        en: ["Foreign", "Animation", "Dubbed"],
        hi: ["Hindi", "Dubbed", "Foreign"],
        bn: ["Bangla", "Dubbed"],
        ta: ["Foreign", "Dubbed"],
    };
    const primaryOrder = langMap[originalLang] || ["Foreign", "Dubbed"];
    return [
        ...new Set([...primaryOrder, ...Object.keys(TV_CATEGORY_URLS)]),
    ].filter((key) => TV_CATEGORY_URLS[key]);
}
