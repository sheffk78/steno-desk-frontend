/**
 * postbuild: patch the SPA shell (spa.html = copy of index.html) served at
 * /app/* and /portal/* via _redirects.
 *
 * WHY: crawlers fetch /app/settings and get the homepage head (same title,
 * homepage canonical) — SiteGuru flags it as an indexation + canonical issue.
 * Login-gated routes shouldn't compete with the homepage anyway.
 *
 * WHAT: after `craco build`, rewrite build/spa.html with a crawler-correct
 * head: noindex robots meta + self-canonical + honest title/description.
 * Bundle script tags are untouched. spa.html is postbuild-stamped AFTER the
 * inject-shells step (see package.json order) so this runs last.
 */
const fs = require('fs');
const path = require('path');
const BUILD = path.join(__dirname, '..', 'build');
const spa = path.join(BUILD, 'spa.html');
if (!fs.existsSync(spa)) { console.error('patch-spa-shells: build/spa.html missing — aborting'); process.exit(1); }
let t = fs.readFileSync(spa, 'utf8');
// noindex robots meta (idempotent)
if (!t.includes('name="robots"')) {
  t = t.replace(/<title>/i, '<meta name="robots" content="noindex, nofollow">\n        <title>');
}
// self-canonical instead of homepage canonical (works for both pretty + minified markup)
t = t.replace(/<link rel="canonical" href="https:\/\/stenodesk\.co\/"\s*\/?>/,
  '<link rel="canonical" href="https://stenodesk.co/spa" />');
// honest title for the gated-app shell
t = t.replace(/<title>Steno Desk — Practice management for freelance court reporters<\/title>/i,
  '<title>StenoDesk App</title>');
fs.writeFileSync(spa, t);
console.log('patch-spa-shells: spa.html head patched (noindex + self-canonical + app title)');
