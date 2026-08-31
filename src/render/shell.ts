import { esc } from "../html.ts";
import { SITE, canonical, href } from "../config.ts";

export interface Page {
  /** In-site path, always starting and ending with "/". */
  path: string;
  title: string;
  description: string;
  /** Raw <script type="application/ld+json"> payloads, already serialised. */
  jsonLd?: string[];
  body: string;
}

const CSS = `
:root{
  --paper:#f4f1ea; --ink:#1a1815; --ink-soft:#59524a; --rule:#cfc6b6;
  --mark:#7a2b1e; --tint:#e9e3d6; --machine:#3c3a35;
}
@media (prefers-color-scheme:dark){
  :root{ --paper:#14130f; --ink:#ece7dc; --ink-soft:#9d968a; --rule:#3a362e;
         --mark:#d97a5f; --tint:#1e1c17; --machine:#c6c0b4; }
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0; background:var(--paper); color:var(--ink);
  font-family:Newsreader,Georgia,'Times New Roman',serif;
  font-size:19px; line-height:1.6; font-optical-sizing:auto;
}
.wrap{max-width:46rem;margin:0 auto;padding:0 1.5rem}
a{color:inherit;text-decoration:none;border-bottom:1px solid var(--rule)}
a:hover{border-bottom-color:var(--mark);color:var(--mark)}
h1,h2,h3{font-family:'Instrument Serif',Georgia,serif;font-weight:400;letter-spacing:-.01em;line-height:1.12;margin:0}
h1{font-size:clamp(2.1rem,5.5vw,3.1rem)}
h2{font-size:1.6rem;margin-top:3rem}
h3{font-size:1.15rem}
p{margin:1rem 0}
.mono,code{font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78rem;letter-spacing:.01em}

/* masthead */
header.mast{border-bottom:2px solid var(--ink);margin-bottom:2.5rem}
header.mast .wrap{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;padding-top:1.1rem;padding-bottom:.7rem;flex-wrap:wrap}
.logo{font-family:'Instrument Serif',Georgia,serif;font-size:1.5rem;border:0;letter-spacing:-.02em}
.logo b{color:var(--mark);font-weight:400}
nav.mast-nav{display:flex;gap:1.25rem}
nav.mast-nav a{border:0;font-size:.78rem;text-transform:uppercase;letter-spacing:.12em;font-family:'IBM Plex Mono',monospace;color:var(--ink-soft)}
nav.mast-nav a:hover{color:var(--mark)}

/* the machine record block: this is the credibility of the whole site */
.record{border:1px solid var(--rule);border-left:3px solid var(--mark);background:var(--tint);padding:1rem 1.1rem;margin:1.5rem 0}
.record dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:.35rem 1rem}
.record dt{font-family:'IBM Plex Mono',monospace;font-size:.68rem;text-transform:uppercase;letter-spacing:.11em;color:var(--ink-soft);padding-top:.2em}
.record dd{margin:0;font-family:'IBM Plex Mono',monospace;font-size:.8rem;color:var(--machine);word-break:break-word}
.record .prompt{white-space:pre-wrap;background:var(--paper);border:1px solid var(--rule);padding:.55rem .65rem;display:block}
@media (max-width:34rem){.record dl{grid-template-columns:1fr}.record dt{padding-top:.6em}}

.kicker{font-family:'IBM Plex Mono',monospace;font-size:.7rem;text-transform:uppercase;letter-spacing:.16em;color:var(--mark);margin:0 0 .75rem}
.lede{font-size:1.15rem;color:var(--ink-soft);margin-top:1rem}
.excerpt{border-left:2px solid var(--rule);padding-left:1.1rem;margin:1.5rem 0;font-style:italic;color:var(--ink-soft)}

/* ranked brands */
ol.brands{list-style:none;margin:1.5rem 0 0;padding:0;counter-reset:b}
ol.brands>li{counter-increment:b;border-top:1px solid var(--rule);padding:1.15rem 0 1.15rem 3rem;position:relative}
ol.brands>li:last-child{border-bottom:1px solid var(--rule)}
ol.brands>li::before{content:counter(b,decimal-leading-zero);position:absolute;left:0;top:1.15rem;font-family:'IBM Plex Mono',monospace;font-size:.8rem;color:var(--mark)}
.brand-name{font-family:'Instrument Serif',Georgia,serif;font-size:1.35rem;display:block}
.brand-note{margin:.35rem 0 0;font-size:.95rem;color:var(--ink-soft)}
ul.sources{list-style:none;margin:.7rem 0 0;padding:0}
ul.sources li{font-size:.85rem;padding:.15rem 0}
ul.sources .dom{font-family:'IBM Plex Mono',monospace;font-size:.7rem;color:var(--ink-soft);margin-left:.4rem}
.nosources{font-family:'IBM Plex Mono',monospace;font-size:.72rem;color:var(--ink-soft);margin-top:.6rem}

/* index */
ul.catlist{list-style:none;margin:2rem 0;padding:0}
ul.catlist li{border-top:1px solid var(--rule);padding:1rem 0}
ul.catlist li:last-child{border-bottom:1px solid var(--rule)}
ul.catlist a{border:0;font-family:'Instrument Serif',Georgia,serif;font-size:1.3rem;display:block}
ul.catlist a:hover{color:var(--mark)}
ul.catlist .meta{font-family:'IBM Plex Mono',monospace;font-size:.68rem;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.1em;margin-top:.3rem}

/* model-stated uncertainty: content, not small print */
.caveat{border:1px solid var(--mark);background:var(--tint);padding:.9rem 1.1rem;margin:1.75rem 0}
.caveat-label{font-family:'IBM Plex Mono',monospace;font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;color:var(--mark);margin:0 0 .5rem}
.caveat ul{margin:0;padding-left:1.1rem;font-size:.92rem;color:var(--ink-soft)}
.caveat li{margin:.3rem 0}
.brand-row{margin:.4rem 0 0;font-size:.88rem;color:var(--ink-soft)}
.brand-row .lbl{display:block;font-family:'IBM Plex Mono',monospace;font-size:.62rem;text-transform:uppercase;letter-spacing:.12em;color:var(--mark);opacity:.85}
.caveat-row{border-left:2px solid var(--mark);padding-left:.7rem}
.verdict-only{border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:1.5rem 0;margin:1.5rem 0}
.verdict-label{font-family:'IBM Plex Mono',monospace;font-size:.68rem;text-transform:uppercase;letter-spacing:.14em;color:var(--mark);margin:0 0 .6rem}
.verdict-only p:last-child{margin:0;font-family:'Instrument Serif',Georgia,serif;font-size:1.3rem;line-height:1.35}
.notice{border:1px dashed var(--mark);padding:.85rem 1rem;font-size:.9rem;margin:1.5rem 0;color:var(--ink-soft)}
.notice strong{color:var(--mark);font-weight:400}
.cta{margin:2.5rem 0;padding:1.25rem 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
footer{margin:4rem 0 3rem;border-top:2px solid var(--ink);padding-top:1rem;font-size:.82rem;color:var(--ink-soft)}
footer .wrap{display:flex;gap:1.25rem;flex-wrap:wrap;justify-content:space-between}
main{padding-bottom:1rem}
hr{border:0;border-top:1px solid var(--rule);margin:2.5rem 0}
`.trim();

export function renderPage(p: Page): string {
  const url = canonical(p.path);
  const ld = (p.jsonLd ?? []).map((j) => `<script type="application/ld+json">\n${j}\n</script>`).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:opsz,wght@6..72,400;6..72,600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>${CSS}</style>
${ld}
</head>
<body>
<header class="mast"><div class="wrap">
<a class="logo" href="${href("/")}">Answer<b> Ledger</b></a>
<nav class="mast-nav">
<a href="${href("/")}">Index</a>
<a href="${href("/method/")}">Method</a>
<a href="https://github.com/${SITE.repo}">Source</a>
</nav>
</div></header>
<main class="wrap">
${p.body}
</main>
<footer><div class="wrap">
<span>${esc(SITE.name)} &mdash; every entry names its model, its prompt and its UTC timestamp. Nothing here is for sale to the vendors it names.</span>
<span><a href="${href("/method/")}">How this was made</a> &nbsp;·&nbsp; <a href="https://github.com/${SITE.repo}/issues">Delist or request</a></span>
</div></footer>
</body>
</html>
`;
}
