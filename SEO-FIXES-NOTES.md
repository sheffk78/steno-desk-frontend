# StenoDesk SEO Fixes — 2026-09-29 — Analysis Notes

## Repo / source identification

- **Marketing site source:** `github.com/sheffk78/steno-desk-frontend` (Cloudflare Pages deploy)
- **Local working copy:** `/Users/socializerender/.openclaw/workspace/Kit/life/brands/StenoDesk/_frontend`
- Live marketing pages are static HTML in that repo: `public/index.html` (CRA SPA shell for `/`),
  `public/signup.html`, `public/login.html`, `public/forgot-password.html`, `public/reset-password.html`,
  `public/404.html`, `public/microtools/*.html` (5 calculators + hub).
- The app repo `sheffk78/steno-desk-app` (frontend/ + backend/) shares the SPA shell template but
  contains NO microtools, no signup.html, no _redirects — it is NOT the marketing-site source.
  Local clone of steno-desk-app: `/Users/socializerender/projects/steno-desk-app`.
- Local `_frontend` clone was 10 commits behind origin/main; synced (ff-only) to `49dc634` first.
- Branch: `seo-fixes-20260929` (from `49dc634`, latest origin/main). No push, no deploy.

## Issue mapping (from live-site crawl, 2026-09-29)

### (1) Meta description issue — 1 page = `/signup` (public/signup.html line 7)
Mojibake em-dash in live + repo source: `Sign up for StenoDesk free â practice management...`
Only page on the site with a broken/invalid description string → matches "1 page has issue".
Fix: clean 152-char description with a real em dash.

### (2) Heading structure issue — 1 page = `/` homepage (public/index.html)
The homepage is a CRA SPA; served HTML has an EMPTY `<div id="root">` — zero crawlable headings,
no crawlable H1 anywhere (verified on live HTML). SiteGuru flags the heading check on exactly
this kind of page. Fix (no framework change): static crawler-visible shell inside #root —
semantic H1 + supporting paragraph + internal links (also feeds fix #3). React createRoot
replaces the shell client-side on hydration; human users see no difference.

### (3) Internal linking — 3 pages with no internal links
Crawlable-link map (grep of hrefs in served HTML):
- signup.html, login.html, forgot-password.html, reset-password.html: each links ONLY to `/`.
  No other page links TO them (SPA nav is JS-rendered; footer links live in Landing.jsx client
  render only). These are the orphan candidates — Google-indexable (each has its own title +
  description + canonical, deliberately so per commit b16e59e), unlike the noindex 404.
- Fix: contextual internal-link blocks — signup links to /microtools/, /login, /forgot-password;
  login links to /signup, /microtools/; forgot links to /login; reset links to /login.
  (signup + login + forgot-password are the presumed 3 orphans; reset gets links too.)

### (4) Page speed — 3 slow pages (low-risk static improvements ONLY)
Assets measured live: `/` pulls render-blocking font CSS (Inter 600 @ Google Fonts) + 693 KB JS
bundle + gtag + PostHog + Reddit pixel. Microtools pages pull a 4-weight Inter font CSS +
gtag.js + PostHog + Reddit pixel + Cloudflare email-decode. In-scope static fixes:
- `/` (index.html + spa build source): preload the Inter 600 latin woff2 (URL verified live:
  fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2)
  + dns-prefetch/preconnect for analytics hosts.
- `/signup` + `/microtools/*`: add preconnect for fonts.gstatic.com (missing on some) +
  dns-prefetch for www.googletagmanager.com and us.i.posthog.com.
- Microtool images are 786-byte SVGs (in-viewport logo — lazy-loading is an anti-pattern, skipped).
- No framework/bundling changes (693KB main.js split = out of scope by task constraint).

## Mojibake inventory (same root cause class as issue 1, fixed in same sweep)
- public/signup.html: description + og/twitter strings contain `â` (broken em dash)
- public/login.html, forgot-password.html, reset-password.html: og/twitter titles `Steno Desk â` (broken em dash)
- public/404.html: "We couldnÃ¢ÂÂt find that page" (broken apostrophe) — noindex page, body text only
- public/microtools/index.html was already repaired upstream (commit 335a6d7)

## Commit plan (granular)
1. fix(seo): signup meta description mojibake → clean description
2. fix(seo): og/twitter mojibake em-dashes on auth shells + 404 apostrophe
3. fix(seo): homepage static shell (H1 + tagline + internal links) → heading structure + link graph
4. fix(seo): auth-shell internal linking (signup/login/forgot/reset)
5. perf(seo): font preload on `/` + preconnect/dns-prefetch hints (auth shells + microtools)
6. docs: summary report

## Constraints honored
- No push, no deploy. Branch `seo-fixes-20260929` only.
- SiteGuru report links behind login — issues diagnosed from the live site directly.