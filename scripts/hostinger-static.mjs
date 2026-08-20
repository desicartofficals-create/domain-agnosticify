import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = join(root, "dist");
const legacyClient = join(dist, "client");
const nitroPublic = join(root, ".output", "public");
const client = existsSync(nitroPublic) ? nitroPublic : legacyClient;

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

function toPublicPath(path) {
  return path.slice(client.length + 1).replaceAll("\\", "/");
}

if (!existsSync(client)) {
  console.error(
    "Hostinger setup failed: neither .output/public nor dist/client was created by the build.",
  );
  process.exit(1);
}

mkdirSync(dist, { recursive: true });
for (const entry of readdirSync(client)) {
  cpSync(join(client, entry), join(dist, entry), { recursive: true, force: true });
}

const allFiles = listFiles(client).map(toPublicPath);
const entryFile = allFiles.find((file) => file.endsWith(".js") && readFileSync(join(client, file), "utf8").includes("hydrateRoot"));

if (!entryFile) {
  console.error("Hostinger setup failed: could not find the browser entry file.");
  process.exit(1);
}

const cssLinks = allFiles
  .filter((file) => file.endsWith(".css"))
  .map((href) => `    <link rel="stylesheet" href="/${href}">`)
  .join("\n");

const tiktokPixel = [
  "    <!-- TikTok Pixel Code Start -->",
  "    <script>",
  `!function (w, d, t) {`,
  `  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(`,
  `var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")`,
  `;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};`,
  `  ttq.load('DA3EO2BC77U2POR0QBNG');`,
  `  ttq.page();`,
  `}(window, document, 'ttq');`,
  "    <\/script>",
  "    <!-- TikTok Pixel Code End -->",
].join("\n");

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DesiCart — Premium Smartwatches, Earbuds & Headphones</title>
    <meta name="description" content="DesiCart is your premium online destination for top-quality electronics and accessories. Free delivery across Pakistan.">
    <meta property="og:site_name" content="DesiCart">
    <meta property="og:title" content="DesiCart — Premium Smartwatches, Earbuds & Headphones">
    <meta property="og:description" content="Your premium online destination for top-quality electronics and accessories. Free delivery across Pakistan.">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="DesiCart — Premium Smartwatches, Earbuds & Headphones">
    <meta name="twitter:description" content="Your premium online destination for top-quality electronics and accessories. Free delivery across Pakistan.">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap">
${tiktokPixel}
${cssLinks}
    <script type="module" src="/${entryFile}"></script>
  </head>
  <body>
    <script>window.$_TSR={router:{matches:[],manifest:{routes:[]},dehydratedData:{}},matches:[],buffer:[],h:function(){}};</script>
  </body>
</html>
`;

writeFileSync(join(dist, "index.html"), indexHtml);

const htaccess = `Options -Indexes
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`;

writeFileSync(join(dist, ".htaccess"), htaccess);
mkdirSync(join(dist, "server"), { recursive: true });

if (!existsSync(join(dist, "index.html"))) {
  console.error("Hostinger setup failed: dist/index.html was not created.");
  process.exit(1);
}

// Deployment guardrail: the build must stay domain-agnostic. Every asset,
// script and stylesheet reference in index.html has to be root-relative, and
// no legacy hostname may be baked into the generated HTML.
const generated = readFileSync(join(dist, "index.html"), "utf8");
const legacyHosts = ["desicart.xyz"];
const bakedHost = legacyHosts.find((host) => generated.includes(host));
if (bakedHost) {
  console.error(`Hostinger setup failed: hardcoded hostname "${bakedHost}" found in dist/index.html.`);
  process.exit(1);
}

const allowedAbsolutePrefixes = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];
const absoluteRefs = [...generated.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)]
  .map((match) => match[1])
  .filter((url) => !allowedAbsolutePrefixes.some((prefix) => url.startsWith(prefix)));
if (absoluteRefs.length > 0) {
  console.error(
    `Hostinger setup failed: absolute asset URLs in dist/index.html must be relative:\n  ${absoluteRefs.join("\n  ")}`,
  );
  process.exit(1);
}

console.log(
  `Hostinger static output ready from ${client === nitroPublic ? ".output/public" : "dist/client"}: dist/index.html and .htaccess created.`,
);