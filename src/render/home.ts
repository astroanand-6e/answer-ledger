import type { LoadedCategory } from "../types.ts";
import { esc, jsonLd, utcDate } from "../html.ts";
import { SITE, canonical, href, issueUrl, CANONICAL_ORIGIN, BASE_PATH } from "../config.ts";
import { renderPage } from "./shell.ts";
import { categoryPath } from "./category.ts";

export function renderHome(cats: LoadedCategory[]): string {
  const models = [...new Set(cats.flatMap((c) => c.runs.map((r) => r.modelDisplay)))].sort();

  const ld = jsonLd({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonical("/")}#index`,
    url: canonical("/"),
    name: SITE.name,
    description: SITE.tagline,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: SITE.name, url: `${CANONICAL_ORIGIN}${BASE_PATH}/` },
    hasPart: cats.map((c) => ({
      "@type": "Article",
      url: canonical(categoryPath(c.slug)),
      headline: c.question,
      datePublished: c.lastmod,
    })),
  });

  const list = cats.length
    ? `<ul class="catlist">${cats.map((c) => `<li>
<a href="${href(categoryPath(c.slug))}">${esc(c.question)}</a>
<div class="meta">${esc(c.runs[0]!.modelDisplay)} · ${esc(utcDate(c.lastmod))}${c.provisional ? " · provisional" : ""}</div>
</li>`).join("")}</ul>`
    : `<p class="notice">No entries yet.</p>`;

  const body = `
<p class="kicker">${esc(SITE.vertical)}</p>
<h1>What the machine actually said.</h1>
<p class="lede">${esc(SITE.positioning)}</p>

<div class="record"><dl>
<dt>Entries</dt><dd>${cats.length} of a hard cap of ${SITE.hardPageCap}</dd>
<dt>Vertical</dt><dd>${esc(SITE.vertical)}</dd>
<dt>Models</dt><dd>${models.length ? esc(models.join(", ")) : "—"}</dd>
<dt>Method</dt><dd>generated in batch, off the request path, committed to git &mdash; <a href="${href("/method/")}">read it</a></dd>
</dl></div>

<h2>The record</h2>
${list}

<div class="cta">
<p><strong>Missing a question?</strong> <a href="${esc(issueUrl("request-category.yml", "Category request: "))}">Request a category</a> — it is a public GitHub issue, which is a higher bar than an email box, and that is on purpose.</p>
<p><strong>Named in an entry and want out?</strong> <a href="${esc(issueUrl("delist-brand.yml", "Delist request: "))}">Ask to be delisted</a>. Free, permanent, no email required. We do not, and will not, charge to remove anyone.</p>
</div>
`.trim();

  return renderPage({
    path: "/",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: `${SITE.tagline} ${cats.length} recorded answers about ${SITE.verticalMidSentence}. Each entry states the exact model, the verbatim prompt and the UTC timestamp.`,
    jsonLd: [ld],
    body,
  });
}
