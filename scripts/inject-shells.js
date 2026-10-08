/**
 * postbuild: inject SPA bootstrap + analytics into the 4 auth-route crawler
 * shells (signup/login/forgot-password/reset-password).
 *
 * WHY: since commit b16e59e (2026-09-12) these routes serve their own static
 * crawler shells (per-route title/description/canonical). Those shells had no
 * React bundle — every HUMAN arriving directly at /signup etc. got a dead
 * page ("You need to enable JavaScript"). Kimberly Uhles' Oct 5 signup only
 * succeeded because she navigated client-side from the homepage.
 *
 * WHAT: run after `craco build`, when build/index.html has the final hashed
 * bundle names. For each shell we:
 *   1. insert the bundle <script defer> + hashed CSS <link> (from build/index.html)
 *   2. copy the analytics blocks (posthog init, gtag config, DataCloneError
 *      guard, Reddit pixel) verbatim from build/index.html
 *   3. leave each shell's SEO head (title/description/canonical/ld+json) intact
 * Crawlers still get their unique per-route head metadata; humans get a
 * working app; /signup visits finally show up in PostHog.
 */
const fs = require('fs');
const path = require('path');

const BUILD = path.join(__dirname, '..', 'build');
const SHELLS = ['signup.html', 'login.html', 'forgot-password.html', 'reset-password.html'];

const indexHtml = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');

// --- hashed assets from the built index.html ---
const jsMatch = indexHtml.match(/<script[^>]*\ssrc="(\/static\/js\/main\.[^"]+\.js)"[^>]*>/);
const cssMatch = indexHtml.match(/<link[^>]*href="(\/static\/css\/main\.[^"]+\.css)"[^>]*>/);
if (!jsMatch || !cssMatch) {
  console.error('inject-shells: could not find hashed main.js/main.css in build/index.html — aborting injection');
  process.exit(1); // fail the build loudly rather than deploy broken shells
}
const jsTag = `<script defer src="${jsMatch[1]}"></script>`;
const cssTag = `<link rel="stylesheet" href="${cssMatch[1]}">`;

// --- analytics scripts copied verbatim from index.html (skip ld+json blocks) ---
const inlineScripts = [...indexHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g)].map(m => m[0]);
const analytics = inlineScripts.filter(s => {
  const isLdJson = /application\/ld\+json/.test(s.slice(0, 80));
  const isHomepageSchema = /WebSite|SoftwareApplication/.test(s);
  return !isLdJson && !isHomepageSchema && /posthog\.init|gtag\(\s*["']config|DataCloneError/.test(s);
});
if (analytics.length < 2) {
  console.error('inject-shells: expected posthog/gtag/guard scripts in build/index.html, found', analytics.length, '— aborting');
  process.exit(1);
}
const analyticsBlock = analytics.join('\n');

// --- fonts + analytics origins preconnects (avoid duplicating ones shells already have) ---
const PRECONNECTS = [
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  '<link rel="preload" as="font" type="font/woff2" crossorigin href="https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2" />',
  '<link rel="preconnect" href="https://www.googletagmanager.com" />',
  '<link rel="preconnect" href="https://us.i.posthog.com" />',
].join('\n        ');

// NOTE: /signup etc. MUST be included — posthog only tracks when the bundle runs,
// and these are exactly the funnel pages we need measured.
for (const shell of SHELLS) {
  const p = path.join(BUILD, shell);
  if (!fs.existsSync(p)) {
    console.warn('inject-shells: build/' + shell + ' missing, skipping');
    continue;
  }
  let html = fs.readFileSync(p, 'utf8');

  // 1) preconnects (idempotent: only add if not present)
  if (!html.includes('us.i.posthog.com" />')) {
    const fontTag = '<link rel="preconnect" href="https://fonts.googleapis.com" />';
    if (html.includes(fontTag)) {
      html = html.replace(fontTag, fontTag + '\n        ' + PRECONNECTS);
    } else {
      html = html.replace('</head>', PRECONNECTS + '\n    </head>');
    }
  }

  // 2) hashed CSS
  if (!html.includes('static/css/main')) {
    html = html.replace('</head>', cssTag + '\n    </head>');
  }

  // 3) bundle + analytics right after the root div opens
  if (!html.includes(jsMatch[1])) {
    const rootDiv = html.match(/<div id="root">\s*\n/);
    if (!rootDiv) {
      console.error('inject-shells: no <div id="root"> in ' + shell + ' — aborting');
      process.exit(1);
    }
    html = html.replace(rootDiv[0], rootDiv[0] + '        ' + jsTag + '\n' + analyticsBlock + '\n');
  }

  fs.writeFileSync(p, html);

  // verify
  const out = fs.readFileSync(p, 'utf8');
  const checks = {
    js: /<script defer src="\/static\/js\/main\.[a-f0-9]+\.js"><\/script>|<script defer src="\/static\/js\/main\.[^"]+\.js"><\/script>/.test(out) && out.includes(jsMatch[1]),
    css: out.includes(cssMatch[1]),
    posthog_once: (out.match(/posthog\.init/g) || []).length === 1,
    gtag: out.includes('G-NKES33RM1V'),
  };
  const pass = Object.values(checks).every(Boolean);
  console.log(`inject-shells: ${shell} ${pass ? 'OK' : 'FAIL'} ` + JSON.stringify(checks));
  if (!pass) process.exit(1);
}
console.log('inject-shells: all shells injected with', jsMatch[1]);