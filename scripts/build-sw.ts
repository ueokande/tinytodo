import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basePath } from "./base-path.ts";

const assets = (await readdir("dist/assets")).map((name) => `assets/${name}`);
const files = [
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon.svg",
  ...assets,
];
const urls = [basePath, ...files.map((file) => `${basePath}${file}`)];
const hash = createHash("sha256");
for (const file of files) hash.update(await readFile(`dist/${file}`));
// Different project sites on the same Pages origin must not delete each other's caches.
const prefix = `tiny-${createHash("sha256").update(basePath).digest("hex").slice(0, 8)}-`;
const cache = `${prefix}${hash.digest("hex").slice(0, 16)}`;
await writeFile(
  "dist/sw.js",
  `
const BASE = ${JSON.stringify(basePath)};
const PREFIX = ${JSON.stringify(prefix)};
const CACHE = ${JSON.stringify(cache)};
const URLS = ${JSON.stringify(urls)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request, {ignoreVary: true});
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) {
      if (event.request.mode === 'navigate') {
        const page = await cache.match(BASE + 'index.html');
        if (page) return page;
      }
      throw error;
    }
  }));
});
`,
);
