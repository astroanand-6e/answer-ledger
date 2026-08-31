import type { LoadedCategory } from "../types.ts";
import { esc, jsonLd } from "../html.ts";
import { SITE, canonical, href, issueUrl } from "../config.ts";
import { renderPage } from "./shell.ts";

/**
 * The method page is the credibility of the whole site. It is written to be
 * read by a sceptic. Do not soften it, do not add marketing, and do not
 * remove a limitation because it is inconvenient.
 */
export function renderMethod(cats: LoadedCategory[]): string {
  const models = [...new Set(cats.flatMap((c) => c.runs.map((r) => `${r.modelDisplay} (${r.model})`)))].sort();

  const ld = jsonLd({
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${canonical("/method/")}#method`,
    url: canonical("/method/"),
    name: `Method — ${SITE.name}`,
    description: `Exactly how the answers on ${SITE.name} were produced, and what they are not.`,
    inLanguage: "en",
  });

  const body = `
<p class="kicker">Method</p>
<h1>How these answers were produced, and what they are not.</h1>
<p class="lede">If you only read one page here, read this one. Everything else on this site is only worth something if this page is true.</p>

<p class="lede" style="font-size:1rem">${esc(SITE.positioning)}</p>

<h2>What we did</h2>
<p>We wrote a list of buying-intent questions about ${esc(SITE.verticalMidSentence)} &mdash; the kind of thing a person actually types when they are about to choose a tool. Each question carries hard constraints, because a question without constraints has no honest answer. We put each one to an AI assistant, once, as a plain prompt with no system instructions, no persona and no follow-up. We recorded what came back: the opening of the answer verbatim, what it named and in what order, and every source it cited.</p>
<p>Then we saved that as a data file, generated a static HTML page from it, and committed both to a public git repository. The page you read is a file on disk. There is no server, no database and no API call when you visit. Nothing is generated for you, personally, on request.</p>
<p>Every prompt ends by telling the model to say so explicitly if it is not confident a product still exists or that its pricing is current. Where it said that, we print it, in its own box, on the page. That is the part of these records we would least like to remove, and the part a vendor-written comparison can never contain.</p>
<p>Several of these questions are deliberately constrained so that most of the market fails them. When the honest answer is that nothing qualifies &mdash; run it yourself and pay nobody &mdash; the page says so, and those are among the more useful pages here.</p>
<h2>Which model answered</h2>
<p>Every answer page states the exact model identifier, the verbatim prompt, and the UTC timestamp of the run. Those three fields are <em>required</em> by the generator: a page whose data is missing any of them does not build at all. It is not possible for a page on this site to exist without saying what produced it.</p>
<p>The models currently in the record:</p>
<ul>${models.map((m) => `<li class="mono">${esc(m)}</li>`).join("")}</ul>
<p><strong>We do not label an answer with the name of an assistant that did not produce it.</strong> If a page does not name a given assistant, that assistant was not asked. When we can run a second assistant, its answer is <em>added</em> as another run on the same page &mdash; the data format has held a slot for it since the first commit &mdash; and the existing run stays exactly as it was. Old runs are never overwritten and never quietly re-dated.</p>

<h2>What this is not</h2>
<ul>
<li><strong>Not a survey.</strong> This is one model's output at one moment. Ask the same question tomorrow and you may get a different answer. That is a fact about language models, not a defect we are hiding.</li>
<li><strong>Not a ranking.</strong> The order on each page is the order the model happened to name things. It is not our judgement, and we do not aggregate it into a score.</li>
<li><strong>Not a review.</strong> Nobody here tested these products. We deliberately publish no ratings and no star markup, because dressing a model's output as a human review would be a lie told in structured data.</li>
<li><strong>Not statistically meaningful.</strong> One run per question. No repeats, no error bars, no sampling. Treat a single entry as an anecdote; treat the corpus as a record of what one assistant said on a given day.</li>
<li><strong>Not complete.</strong> Where a run had no live retrieval, the model answered from training data and cited nothing. Those pages say so in the same box as everything else. An empty source list is a real result and we publish it rather than filling it in.</li>
<li><strong>Not paid for.</strong> No brand has paid to appear here, to be ranked, to be worded differently, or to be removed. There is no mechanism by which they could.</li>
</ul>

<h2>Why one category, and why we stop</h2>
<p>There ${cats.length === 1 ? "is" : "are"} ${cats.length} ${cats.length === 1 ? "entry" : "entries"} here today, and the generator refuses to build past ${SITE.hardPageCap}. That ceiling is deliberate: a corpus that grows without a stopping rule is a way of avoiding finding out whether anyone wanted it. We would rather publish a small number of questions whose constraints are sharp enough to be checkable than a large number nobody can verify. When we stop, we look at whether any of it was read, and we say what we found.</p>

<h2>If you are named here</h2>
<p>Open a <a href="${esc(issueUrl("delist-brand.yml", "Delist request: "))}">delist request</a>. It is a GitHub issue and it needs no email address from you. On the next build your brand is removed from every page, from the index and from the sitemap, and the page carries a neutral note that the record was edited &mdash; without naming you.</p>
<p>To be explicit, because this pattern has a bad history: <strong>we will never charge to remove anyone, and we will never contact a brand to tell them they look bad here.</strong> Page titles describe the question, never a company. If you ever see this site do otherwise, it has broken its own rules and you should say so loudly, in public, <a href="https://github.com/${SITE.repo}/issues">in the issue tracker</a>.</p>

<h2>Check our work</h2>
<p>Every page links to the raw JSON that produced it. The generator is in the same repository and is about a thousand lines of plain TypeScript with no runtime dependencies. Running it twice on unchanged data produces a byte-identical site, so any change to a published answer shows up as a diff that anyone can read. <a href="https://github.com/${SITE.repo}">The whole thing is here.</a></p>

<div class="cta"><p><a href="${href("/")}">&larr; Back to the record</a></p></div>
`.trim();

  return renderPage({
    path: "/method/",
    title: `Method — how these answers were produced | ${SITE.name}`,
    description: `Exactly how ${SITE.name} produces its answer records: the model, the verbatim prompt, the UTC timestamp, and an honest list of what this is not.`,
    jsonLd: [ld],
    body,
  });
}
