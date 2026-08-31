import type { LoadedCategory } from "../types.ts";
import { SITE, canonical } from "../config.ts";
import { utc, utcDate } from "../html.ts";
import { categoryPath } from "./category.ts";

/**
 * Markdown mirror committed at repo root. github.com renders and indexes it,
 * which is a second crawl path for the same artifact at zero extra cost.
 * The HTML page on Pages is canonical; this file says so at the top.
 */
export function renderMarkdown(cat: LoadedCategory): string {
  const url = canonical(categoryPath(cat.slug));
  const out: string[] = [];
  out.push(`# ${cat.question}`, "");
  out.push(`> Canonical page: ${url}`, ">");
  out.push(`> ${cat.summary}`, "");
  if (cat.provisional) {
    out.push(`**Provisional entry.** Recorded while the site was being built, to demonstrate the format. The model, prompt, timestamp and answer below are real and unedited.`, "");
  }
  if (cat.redactions > 0) {
    out.push(`**This record has been edited.** ${cat.redactions} ${cat.redactions === 1 ? "entry was" : "entries were"} removed at the owner's request. Removal is free and never requires payment.`, "");
  }
  for (const run of cat.runs) {
    out.push(`## Run: ${run.modelDisplay}`, "");
    out.push(`| field | value |`, `| --- | --- |`);
    out.push(`| Model | \`${run.model}\` |`);
    out.push(`| Answered | ${utc(run.ranAt)} |`);
    out.push(`| Retrieval | ${run.retrieval ? "yes" : "no — answered from training data, cited nothing"} |`);
    out.push("");
    out.push(`**Verbatim prompt:**`, "", "```text", run.prompt, "```", "");
    out.push(`**Answer, verbatim opening:**`, "", `> ${run.answerExcerpt.replace(/\n/g, "\n> ")}`, "");
    if (run.verdict) out.push(`**Bottom line:** ${run.verdict}`, "");
    if (run.brands.length === 0) {
      out.push(`**No product was recommended.** The constraints in the prompt disqualified every option the model considered.`, "");
    } else {
      out.push(`**Named, in the order named:**`, "");
      for (const b of run.brands) {
        out.push(`${b.rank}. **${b.name}**${b.note ? ` — ${b.note}` : ""}`);
        if (b.pricing) out.push(`   - Pricing, as described: ${b.pricing}`);
        if (b.regret) out.push(`   - Most likely regret: ${b.regret}`);
        if (b.caveat) out.push(`   - **Model unsure:** ${b.caveat}`);
        if (b.sources.length === 0) out.push(`   - _no source cited_`);
        for (const s of b.sources) out.push(`   - [${s.title ?? s.url}](${s.url}) (${s.domain})`);
        if (b.correction) {
          // Editorial, not the model. Labelled as such on its own line so it
          // cannot be quoted back as something the assistant said.
          out.push(`   - **Editor's note (checked ${utcDate(b.correction.checkedAt)}) — not part of the answer:** ${b.correction.note}`);
          for (const s of b.correction.sources) out.push(`     - Evidence: [${s.title ?? s.url}](${s.url}) (${s.domain})`);
        }
      }
      out.push("");
    }
    if (run.caveats?.length) {
      out.push(`**What the model said it was not sure about:**`, "");
      for (const c of run.caveats) out.push(`- ${c}`);
      out.push("");
    }
  }
  out.push(`---`, "");
  out.push(`This is one model's output at one moment. It is not a survey, not a ranking and not a review.`);
  out.push(`See the method: ${canonical("/method/")}`, "");
  out.push(`Named here and want out? Open a delist request: https://github.com/${SITE.repo}/issues/new?template=delist-brand.yml — free, no email, no payment, ever.`, "");
  return out.join("\n");
}
