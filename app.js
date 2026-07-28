// Static Node.js server for Hostinger.
// Serves the pre-built SPA in ./dist (produced by `npm run build`, which also
// runs scripts/hostinger-static.mjs to generate dist/index.html and .htaccess).
// SPA fallback returns index.html for any unknown route, so client-side
// routing works and refreshing a deep link never 403/404s.
//
// Usage on Hostinger:
//   1. Upload the whole project folder.
//   2. In hPanel > Advanced > Node.js, set:
//        - Application root:  your project folder
//        - Application URL:   your domain
//        - Startup file:      app.js
//   3. Click "Run NPM Install", then open the terminal and run: npm run build
//   4. Restart the Node.js app. Done.

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)));
const distDir = join(projectRoot, "dist");
const indexHtml = join(distDir, "index.html");
const port = Number(process.env.PORT || 3000);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function tryStaticFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^([./\\])+/, "");
  const filePath = join(distDir, safe);
  if (!filePath.startsWith(distDir)) return null;
  if (!existsSync(filePath)) return null;
  const stat = statSync(filePath);
  if (!stat.isFile()) return null;
  return filePath;
}

function sendFile(res, filePath, { cache } = {}) {
  const type = mime[extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, {
    "content-type": type,
    "cache-control": cache ?? "public, max-age=31536000, immutable",
  });
  createReadStream(filePath).pipe(res);
}

createServer(async (req, res) => {
  try {
    const urlPath = (req.url || "/").split("?")[0];

    // 1) Root -> index.html (no aggressive cache so updates go live).
    if (urlPath === "/" || urlPath === "/index.html") {
      if (!existsSync(indexHtml)) {
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
        res.end("Build output missing. Run `npm run build` in the Hostinger terminal, then restart the Node.js app.");
        return;
      }
      sendFile(res, indexHtml, { cache: "no-cache" });
      return;
    }

    // 2) Any real file in dist/ (JS, CSS, images, favicon, fonts, etc.).
    const staticFile = tryStaticFile(urlPath);
    if (staticFile) {
      sendFile(res, staticFile);
      return;
    }

    // 3) SPA fallback: unknown route -> serve index.html so the client router
    //    can handle it. Never 403/404 for a valid app route.
    if (existsSync(indexHtml)) {
      sendFile(res, indexHtml, { cache: "no-cache" });
      return;
    }
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch (err) {
    console.error("Request failed:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    }
    res.end("Internal Server Error");
  }
}).listen(port, () => {
  console.log(`DesiCart Node server listening on port ${port}`);
});