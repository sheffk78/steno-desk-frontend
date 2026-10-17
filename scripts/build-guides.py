"""Build static guide HTML pages from content/drafts/*.md using the site shell."""
import pathlib, re, html, json

ROOT = pathlib.Path(__file__).resolve().parents[1]
DRAFTS = ROOT / "content" / "drafts"
OUT = ROOT / "public" / "guides"
OUT.mkdir(exist_ok=True)

SLUGS = {
    "court-reporter-rates.md": ("court-reporter-rates", "What Should a Court Reporter Charge?",
        "Setting freelance court reporter rates for 2026: appearance fees, per-page transcript pricing, realtime premiums, expedite fees, mileage, and how to test your rate card against a real year."),
    "court-reporter-invoice-guide.md": ("court-reporter-invoice-guide", "The Court Reporter Invoice, Line by Line",
        "Every line item a freelance court reporter should bill: appearance fees, per-page transcript charges, copies, rough drafts, exhibits, scopist deductions, mileage, and expedites, plus what a complete invoice includes."),
    "court-reporter-tax-organizer.md": ("court-reporter-tax-organizer", "The 1099 Organizer for Court Reporters",
        "A yearly tax organizer for self-employed court reporters: 1099 income tracking, scopist deductions, mileage logs, equipment and Section 179, software subscriptions, dues, and a quarterly routine that keeps April calm."),
}

TITLE_STEM = " | StenoDesk"

def md_to_body(md: str) -> str:
    """Convert the draft subset: h1->drop(title), h2, bold, lists, links, paragraphs."""
    lines_out = []
    in_list = False
    for raw in md.split("\n"):
        line = raw.rstrip()
        if not line.strip():
            if in_list:
                lines_out.append("</ul>")
                in_list = False
            continue
        if line.startswith("# "):
            continue  # h1 lives in the hero
        m = re.match(r"^## (.+)$", line)
        if m:
            if in_list: lines_out.append("</ul>"); in_list = False
            lines_out.append(f"<h2>{md_inline(m.group(1))}</h2>")
            continue
        m = re.match(r"^\d+\. (.+)$", line)
        if m:
            if not in_list: lines_out.append('<ul class="gd-list">'); in_list = True
            lines_out.append(f"<li>{md_inline(m.group(1))}</li>")
            continue
        if line.startswith("- "):
            if not in_list: lines_out.append('<ul class="gd-list">'); in_list = True
            lines_out.append(f"<li>{md_inline(line[2:])}</li>")
            continue
        if in_list: lines_out.append("</ul>"); in_list = False
        lines_out.append(f"<p>{md_inline(line)}</p>")
    if in_list: lines_out.append("</ul>")
    return "\n      ".join(lines_out)

def md_inline(s: str) -> str:
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\[([^\]]+)\]\((/[^)]+|https://[^)]+)\)", r'<a href="\2">\1</a>', s)
    s = re.sub(r"×", "&#215;", s)
    return s

def page(src: str) -> None:
    slug, h1, desc = SLUGS[src]
    md = (DRAFTS / src).read_text()
    body = md_to_body(md)
    url = f"https://stenodesk.co/guides/{slug}"
    article_ld = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": h1, "description": desc,
        "author": {"@type": "Person", "name": "Jeff Kohler",
                   "url": "https://stenodesk.co/founding"},
        "publisher": {"@type": "Organization", "name": "StenoDesk",
                      "url": "https://stenodesk.co"},
        "datePublished": "2026-10-17", "dateModified": "2026-10-17",
        "mainEntityOfPage": url,
    }
    faq_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList",
              "itemListElement": [
                  {"@type": "ListItem", "position": 1, "name": "StenoDesk", "item": "https://stenodesk.co/"},
                  {"@type": "ListItem", "position": 2, "name": "Guides", "item": "https://stenodesk.co/guides/"},
                  {"@type": "ListItem", "position": 3, "name": h1}]}
    page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{h1}{TITLE_STEM}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="StenoDesk">
<meta property="og:title" content="{h1}{TITLE_STEM}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="https://stenodesk.co/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{h1}{TITLE_STEM}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://stenodesk.co/og-card.png">
<script type="application/ld+json">
{json.dumps(article_ld, ensure_ascii=False)}
</script>
<script type="application/ld+json">
{json.dumps(faq_ld, ensure_ascii=False)}
</script>
<link rel="preconnect" href="https://us.i.posthog.com">
<link rel="stylesheet" href="/microtools/assets/style.css">
<link rel="stylesheet" href="/guides/guides.css">
<link rel="icon" type="image/svg+xml" href="/stenodesk-mark.svg">
<script>
!function(w,d){{if(!w.rdt){{var p=w.rdt=function(){{p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)}};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js?pixel_id=a2_j5hvsdn7sctb",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','a2_j5hvsdn7sctb');rdt('track', 'PageVisit');
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NKES33RM1V"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){{dataLayer.push(arguments);}}
gtag('js', new Date());
gtag('config', 'G-NKES33RM1V');
</script>
<script>
!function(t,e){{var o,n,p,r;e.__SV||((window.posthog=e),(e._i=[]),(e.init=function(i,s,a){{function g(t,e){{var o=e.split(".");2==o.length&&((t=t[o[0]]),(e=t[o[1]])),(t[e]=function(){{t.push([e].concat(Array.prototype.slice.call(arguments,0)))}})}}((p=t.createElement("script")).type="text/javascript",(p.crossOrigin="anonymous"),(p.async=!0),(p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js"),(o=t.getElementsByTagName("script")[0]),o.parentNode.insertBefore(p,o);var u=a;void 0!==a?(u=e[a]=[]):(a="posthog"),(e[a]=[]),(e[a]._i=[[],{{api_host:s.api_host}}],e[a].init=function(i,s,o){{g(i,"0")}}))}})(document,window.posthog||[]);}})(document,window.posthog||[]);
posthog.init("phc_ro2pSY5X2aDA9AWMu9TGmRV2bf6CUiSNLx76o9zmXXi", {{
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
    session_recording: {{
        recordCrossOriginIframes: true,
        capturePerformance: false,
    }},
}});
</script>
<script>window.addEventListener("error",function(e){{if(e.error instanceof DOMException&&e.error.name=="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){{e.stopImmediatePropagation();e.preventDefault()}}}},true);</script>
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a href="/microtools/"><img src="/microtools/assets/stenodesk-logo-full.svg" alt="StenoDesk"></a>
    <span class="pb">Free guides for <a href="https://stenodesk.co">court reporters</a></span>
  </div>
</header>

<main class="wrap">
  <article class="gd-article">
    <section class="page-hero">
      <h1>{h1}</h1>
      <p class="sub">{desc}</p>
      <p class="gd-byline">By Jeff Kohler, founder of StenoDesk &middot; October 2026</p>
    </section>
    <div class="tool-card gd-body">
      {body}
      <div class="gd-bio">Jeff Kohler built StenoDesk, practice-management software for freelance court reporters — job tracking, court-reporter invoices with every line item, and per-client rate memory. He talks to working reporters about their billing every week, and this guide reflects what they actually charge and what actually gets paid.</div>
    </div>
    <div class="cta-banner">
      <div>
        <div class="cta-text">Billing a full week should take minutes, not evenings.</div>
        <div class="cta-sub">StenoDesk remembers per-client rates and builds the invoice with every line item you charge.</div>
      </div>
      <a class="btn" href="/signup">Try StenoDesk Free</a>
    </div>
  </article>
</main>

<footer class="site-footer">
  <div class="wrap">
    <p style="font-weight:600;margin-bottom:4px">Free tools and guides for court reporters</p>
    <div class="footer-links">
      <a href="/guides/court-reporter-rates">Rate-Setting Guide</a>
      <a href="/guides/court-reporter-invoice-guide">Invoice Guide</a>
      <a href="/guides/court-reporter-tax-organizer">1099 Organizer</a>
      <a href="/microtools/invoice-calculator">Invoice Calculator</a>
      <a href="/microtools/">All Tools</a>
      <a href="/founding">Founding User Program</a>
    </div>
    <p class="footer-cta"><a href="/signup">Try StenoDesk Free</a></p>
    <p class="footer-meta">&#169; 2026 StenoDesk. <a href="https://stenodesk.co">stenodesk.co</a></p>
    <p class="footer-contact">Questions? <a href="mailto:support@stenodesk.co">support@stenodesk.co</a></p>
  </div>
</footer>
</body>
</html>
"""
    (OUT / f"{slug}.html").write_text(page_html)
    print("built", f"guides/{slug}.html", f"{len(page_html)//1024}KiB")

for src in SLUGS:
    page(src)