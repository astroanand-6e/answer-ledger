import type { LoadedCategory, Run } from "../types.ts";
import { esc, jsonLd, utc } from "../html.ts";
import { SITE, canonical, href, issueUrl, CANONICAL_ORIGIN, BASE_PATH } from "../config.ts";
import { renderPage } from "./shell.ts";

export const categoryPath = (slug: string): string => `/answers/${slug}/`;

/**
 * The machine record. This is the load-bearing block of the entire site and
 * the reason the Cycle 4 ruling exists. Every field is read from data. The
 * model name is NEVER written in prose anywhere in this file.
 */
function recordBlock(run: Run): string {
  return `<div class="record">
<dl>
<dt>Model</dt><dd>${esc(run.modelDisplay)} <span style="opacity:.7">(${esc(run.model)})</span></dd>
<dt>Answered</dt><dd>${esc(utc(run.ranAt))}</dd>
<dt>Retrieval</dt><dd>${run.retrieval ? "yes — the model could fetch and cite live pages" : "no — answered from training data only, so it cited nothing"}</dd>
<dt>Prompt</dt><dd><span class="prompt">${esc(run.prompt)}</span></dd>
</dl>
</div>`;
}

/**
 * Model-stated uncertainty. Rendered LOUDLY and never dropped. The prompt
 * template explicitly instructs the model to say when it is not confident a
 * product still exists or that its pricing is current; that sentence is the
 * one claim no vendor listicle can make, so it is treated as the most
 * valuable content on the page rather than as small print.
 */
function caveatBlock(caveats: string[]): string {
  if (caveats.length === 0) return "";
  return `<aside class="caveat">
<p class="caveat-label">What the model said it was not sure about</p>
<ul>${caveats.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
</aside>`;
}

function brandsBlock(run: Run): string {
  if (run.brands.length === 0) {
    // A category whose constraints disqualify every vendor is a RESULT, not an
    // empty page. Several of our categories are built to produce exactly this.
    return `<div class="verdict-only">
<p class="verdict-label">No product was recommended</p>
<p>${esc(run.verdict ?? "")}</p>
</div>`;
  }
  const items = run.brands.map((b) => {
    const sources = b.sources.length
      ? `<ul class="sources">${b.sources.map((s) =>
          `<li><a href="${esc(s.url)}" rel="nofollow noopener ugc">${esc(s.title ?? s.url)}</a><span class="dom">${esc(s.domain)}</span></li>`,
        ).join("")}</ul>`
      : `<p class="nosources">No source cited for this recommendation.</p>`;
    const rows: string[] = [];
    if (b.pricing) rows.push(`<p class="brand-row"><span class="lbl">Pricing, as described</span>${esc(b.pricing)}</p>`);
    if (b.regret) rows.push(`<p class="brand-row"><span class="lbl">Most likely regret</span>${esc(b.regret)}</p>`);
    if (b.caveat) rows.push(`<p class="brand-row caveat-row"><span class="lbl">Model unsure</span>${esc(b.caveat)}</p>`);
    return `<li><span class="brand-name">${esc(b.name)}</span>${
      b.note ? `<p class="brand-note">${esc(b.note)}</p>` : ""
    }${rows.join("")}${sources}</li>`;
  }).join("\n");
  return `<ol class="brands">\n${items}\n</ol>`;
}

function runSection(run: Run, i: number, total: number): string {
  return `<section>
${total > 1 ? `<h2>Run ${i + 1}: ${esc(run.modelDisplay)}</h2>` : ""}
${recordBlock(run)}
<h3>What it said, verbatim (opening)</h3>
<blockquote class="excerpt">${esc(run.answerExcerpt)}</blockquote>
<h3>${run.brands.length ? "What it recommended, in the order it named them" : "What it concluded"}</h3>
${run.brands.length && run.verdict ? `<p class="lede">${esc(run.verdict)}</p>` : ""}
${brandsBlock(run)}
${caveatBlock(run.caveats ?? [])}
</section>`;
}

export function renderCategory(cat: LoadedCategory): string {
  const path = categoryPath(cat.slug);
  const url = canonical(path);
  const engines = [...new Set(cat.runs.map((r) => r.modelDisplay))].join(", ");

  const ld = jsonLd({
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#record`,
    url,
    headline: cat.question,
    description: cat.summary,
    inLanguage: "en",
    datePublished: cat.lastmod,
    dateModified: cat.lastmod,
    isAccessibleForFree: true,
    author: { "@type": "Organization", name: SITE.name, url: `${CANONICAL_ORIGIN}${BASE_PATH}/` },
    publisher: { "@type": "Organization", name: SITE.name, url: `${CANONICAL_ORIGIN}${BASE_PATH}/` },
    about: { "@type": "Thing", name: cat.question },
    // Honest: these are AI outputs recorded as source works, NOT human reviews.
    // Deliberately no Review / AggregateRating / rating anywhere on this site.
    isBasedOn: cat.runs.map((r) => ({
      "@type": "CreativeWork",
      name: `Answer from ${r.modelDisplay}`,
      dateCreated: r.ranAt,
      text: r.answerExcerpt,
      creator: {
        "@type": "SoftwareApplication",
        name: r.modelDisplay,
        identifier: r.model,
        applicationCategory: "AI assistant",
      },
    })),
    mentions: [...new Set(cat.runs.flatMap((r) => r.brands.map((b) => b.name)))]
      .sort()
      .map((name) => ({ "@type": "Thing", name })),
    citation: [...new Map(
      cat.runs.flatMap((r) => r.brands.flatMap((b) => b.sources)).map((s) => [s.url, s]),
    ).values()]
      .sort((a, b) => a.url.localeCompare(b.url))
      .map((s) => ({ "@type": "WebPage", url: s.url, ...(s.title ? { name: s.title } : {}) })),
  });

  const body = `
<p class="kicker">Recorded answer · ${esc(SITE.vertical)}</p>
<h1>${esc(cat.question)}</h1>
<p class="lede">${esc(cat.summary)}</p>
${cat.provisional ? `<div class="notice"><strong>Provisional entry.</strong> This category was recorded while the site was being built and exists to demonstrate the format. The answer, model, prompt and timestamp below are real and unedited; the vertical is not final.</div>` : ""}
${cat.redactions > 0 ? `<div class="notice"><strong>This record has been edited.</strong> ${cat.redactions} ${cat.redactions === 1 ? "entry was" : "entries were"} removed at the owner&#39;s request. Removals are free, permanent and never require payment.</div>` : ""}
<p>This page is a record of one question put to ${esc(engines)}, kept exactly as answered. It is not a ranking, not a review and not an endorsement by ${esc(SITE.name)}, and nothing on it is for sale to the vendors it names. <a href="${href("/method/")}">Read the method</a>.</p>
${cat.runs.map((r, i) => runSection(r, i, cat.runs.length)).join("\n<hr>\n")}
<div class="cta">
<p><strong>Named here and want out?</strong> <a href="${esc(issueUrl("delist-brand.yml", `Delist request: `))}">Open a delist request</a>. No email, no account beyond GitHub, no payment — ever. It is removed from this page, the index and the sitemap on the next build.</p>
<p><strong>Want a question added?</strong> <a href="${esc(issueUrl("request-category.yml", "Category request: "))}">Request a category</a>.</p>
</div>
<p class="mono"><a href="https://github.com/${SITE.repo}/blob/main/data/categories/${esc(cat.slug)}.json">View the raw data for this page &rarr;</a></p>
`.trim();

  return renderPage({
    path,
    // Category-keyed. The brand-keyed guard in build.ts enforces this.
    title: `${cat.question} — recorded answer | ${SITE.name}`,
    description: cat.summary,
    jsonLd: [ld],
    body,
  });
}
