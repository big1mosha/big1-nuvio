#!/usr/bin/env node

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "src");
const OUT_DIR = path.join(__dirname, "providers");

const EXTERNAL = [
    "cheerio-without-node-native",
    "react-native-cheerio",
    "cheerio",
    "crypto-js",
    "axios",
];

function discoverProviders() {
    if (!fs.existsSync(SRC_DIR)) return [];
    return fs
        .readdirSync(SRC_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
}

async function buildProvider(name, minify) {
    const entry = path.join(SRC_DIR, name, "index.js");

    if (!fs.existsSync(entry)) {
        console.warn(`skip ${name}: src/${name}/index.js not found`);
        return false;
    }

    try {
        await esbuild.build({
            entryPoints: [entry],
            outfile: path.join(OUT_DIR, `${name}.js`),
            bundle: true,
            format: "cjs",
            platform: "neutral",
            target: "es2016",
            minify,
            external: EXTERNAL,
            logLevel: "warning",
        });
        console.log(`built ${name}.js`);
        return true;
    } catch (error) {
        console.error(`failed ${name}: ${error.message}`);
        return false;
    }
}

async function main() {
    const names = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
    const minify = process.argv.includes("--minify");
    const providers = names.length ? names : discoverProviders();

    if (providers.length === 0) {
        console.log("no providers found in src/");
        return;
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    let built = 0;
    for (const name of providers) {
        if (await buildProvider(name, minify)) built++;
    }

    console.log(`built ${built}/${providers.length}`);
}

main();
