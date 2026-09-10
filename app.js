// Static Node.js server for Hostinger.
// Serves the pre-built SPA in ./dist (produced by `npm run build`, which also
// runs scripts/hostinger-static.mjs to generate dist/index.html and .htaccess).
// SPA fallback returns index.html for any unknown route, so client-side
// routing works and refreshing a deep link never 403/404s.
//
// DOMAIN-AGNOSTIC: no hostname is hardcoded, and no request headers are read.
// Every asset is served from a root-relative path ("/assets/..."), so the
// browser resolves it against whatever domain served the page.
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
const host = process.env.HOST || "0.0.0.0";

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
  try {
    const safe = normalize(decodeURIComponent(urlPath)).replace(/^([./\\])+/, "");
    const filePath = join(distDir, safe);
    if (!filePath.startsWith(distDir)) return null;
    if (!existsSync(filePath)) return null;
    return statSync(filePath).isFile() ? filePath : null;
  } catch {
    return null;
  }
}

const COMPRESSIBLE = /^(text\/|application\/(javascript|json|xml)|image\/svg)/;

function sendFile(res, req, filePath, cache) {
  const type = mime[extname(filePath).toLowerCase()] || "application/octet-stream";
  const headers = {
    "content-type": type,
    "cache-control": cache || "public, max-age=31536000, immutable",
    vary: "Accept-Encoding",
  };

  const accept = String((req && req.headers && req.headers["accept-encoding"]) || "");
  const stream = createReadStream(filePath);

  if (COMPRESSIBLE.test(type)) {
    if (/\bbr\b/.test(accept)) {
      headers["content-encoding"] = "br";
      res.writeHead(200, headers);
      stream.pipe(createBrotliCompress()).pipe(res);
      return;
    }
    if (/\bgzip\b/.test(accept)) {
      headers["content-encoding"] = "gzip";
      res.writeHead(200, headers);
      stream.pipe(createGzip()).pipe(res);
      return;
    }
  }

  res.writeHead(200, headers);
  stream.pipe(res);
}

function sendIndex(res) {
  if (!existsSync(indexHtml)) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Build output missing. Run `npm run build`, then restart the Node.js app.");
    return;
  }
  sendFile(res, indexHtml, "no-cache");
}

const server = createServer((req, res) => {
  try {
    const urlPath = (req.url || "/").split("?")[0];

    // 1) Root -> index.html (no aggressive cache so updates go live).
    if (urlPath === "/" || urlPath === "/index.html") {
      sendIndex(res);
      return;
    }

    // 2) Any real file in dist/ (JS, CSS, images, favicon, fonts, etc.).
    const staticFile = tryStaticFile(urlPath);
    if (staticFile) {
      sendFile(res, staticFile);
      return;
    }

    // 3) SPA fallback: unknown route -> index.html for the client router.
    sendIndex(res);
  } catch (err) {
    console.error("Request failed:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    }
    res.end("Internal Server Error");
  }
});

server.on("error", (err) => {
  console.error("HTTP server error:", err);
});

server.listen(port, host, () => {
  console.log(`Node server listening on ${host}:${port}`);
});
