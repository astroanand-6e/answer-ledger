# What docs tool gives me static HTML I actually own?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/docs-tool-that-outputs-static-html/
>
> A dated record of what one AI assistant answered when asked for a documentation and knowledge-base tool that emits portable static HTML, keeps content as Markdown in your own git repo, includes search, and costs under $15 a month.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:41:03 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need product documentation / knowledge base. My hard constraints are: must output static HTML I can host anywhere so I am never locked in; free or under $15/month; search built in; my content stays in Markdown in my own git repo. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> "Markdown in my own git repo" plus "static HTML I can host anywhere" eliminates the entire hosted knowledge-base category in one move — Notion, Intercom Help Center, Zendesk Guide, HelpScout Docs and GitBook all keep your content in their database and rent you a rendering of it. What is left is static site generators, and the good news is that the best ones cost nothing and the constraint about $15/month never even comes into play. The only real decision is which generator, and the tiebreaker is whose search you trust and whose upgrade path you can stomach. I would start with Material for MkDocs.

**Bottom line:** Every option that genuinely satisfies these constraints is a free open-source static site generator; the money question is moot. Pick Material for MkDocs unless you already have a JavaScript build pipeline, in which case pick Starlight.

**Named, in the order named:**

1. **Material for MkDocs** — It is a Markdown-in, static-HTML-out generator with a genuinely good client-side search built into the theme, so all four constraints are satisfied by the default configuration rather than by plugins you have to assemble.
   - Pricing, as described: The theme is free and open source (MIT). There is a paid sponsors-only "Insiders" edition with extra features, funded through GitHub Sponsors at a monthly amount; the free edition is complete enough to run a real docs site indefinitely.
   - Most likely regret: It is Python. Your 3-person JavaScript shop now has a second toolchain to keep alive in CI, and the day a plugin pins an old Python version you will be debugging virtualenvs instead of writing docs.
   - **Model unsure:** Insiders is a moving target — features graduate from it into the free edition over time, and I cannot confirm the current sponsorship tier or which features are currently gated. Check the project's own Insiders page before you assume a feature is free.
   - _no source cited_
2. **Astro Starlight** — Content is plain Markdown/MDX files in your repo, the build emits fully static HTML with no runtime dependency on any service, and site search ships in the box via a bundled Pagefind index.
   - Pricing, as described: Free and open source (MIT). No hosted component, no account, nothing to pay.
   - Most likely regret: You are on the Astro release treadmill. Major versions arrive at a real clip, and a docs site is exactly the kind of low-priority repo that quietly rots two majors behind until an upgrade becomes a weekend.
   - _no source cited_
3. **Docusaurus** — The most battle-tested Markdown-to-static-HTML docs generator in the JavaScript ecosystem, with first-class versioned docs — which matters the moment you ship a v2 API and still owe v1 customers a page.
   - Pricing, as described: Free and open source (MIT). Its default search integration is Algolia DocSearch, which is free for qualifying open/public documentation sites but is a separate service with its own eligibility rules.
   - Most likely regret: The default search is not actually yours. If DocSearch declines your site or changes its terms, your "self-contained static site" suddenly needs a paid search vendor or a plugin swap — swap in a local search plugin from day one if the ownership constraint is real.
   - **Model unsure:** I am not confident about DocSearch's current eligibility criteria for commercial SaaS documentation, and I will not guess at them.
   - _no source cited_
4. **VitePress** — Fast, minimal, Markdown files in git, static output, and a local client-side search you enable with a single line of config — no third-party search service in the loop at all.
   - Pricing, as described: Free and open source (MIT).
   - Most likely regret: It is deliberately spartan. When you want product-docs furniture that MkDocs and Docusaurus give you free — versioning, a tabbed API reference, admonition variety — you will be writing the theme yourself.
   - _no source cited_
5. **Hugo** — Single static binary, no runtime ecosystem to maintain, and it will still build your Markdown in five years without a dependency archaeology expedition — which is the strongest possible form of "never locked in".
   - Pricing, as described: Free and open source (Apache 2.0). Docs themes such as Docsy and Hextra are free as well.
   - Most likely regret: Hugo's Go template language is the least pleasant thing in this list to customise, and search is theme-dependent rather than guaranteed — you may end up wiring Pagefind or a JSON index yourself.
   - **Model unsure:** Whether search is built in depends entirely on which theme you pick, so treat the search constraint as unresolved until you have chosen one.
   - _no source cited_
6. **Sphinx with MyST** — Produces static HTML with a built-in search index that requires no external service, and MyST lets you keep authoring in Markdown rather than reStructuredText.
   - Pricing, as described: Free and open source (BSD). Read the Docs will host it, historically with a free tier for open-source projects and paid plans for commercial ones.
   - Most likely regret: Sphinx is a documentation system built for Python API reference, and you will feel that in every configuration decision. For a marketing-adjacent SaaS knowledge base it is a heavy, oddly-shaped tool.
   - **Model unsure:** I am not confident about Read the Docs' current commercial pricing or the boundary of its free tier, and I am deliberately not quoting figures.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have not read a single current pricing page, release note or feature list. Everything above is from memory, and for the sponsorware and hosted-search components in particular that memory may already be wrong.
- Because I could not fetch anything, I cannot supply the documentation and pricing sources you asked me to list. I would rather tell you that than manufacture plausible-looking citations.
- I am confident all six of these projects existed and were actively maintained as of my knowledge cutoff. Static site generators are unusually durable, so I would be surprised if any had disappeared — but I cannot confirm it from here.
- GitBook, Notion, Confluence, Zendesk Guide, Intercom and HelpScout are absent on purpose, not by oversight. All of them store your content in their database and none of them hands you a static HTML site you can rehost elsewhere; several are also above your price ceiling once you add a second seat. If "static HTML I own" is softer than you wrote it, GitBook in particular comes straight back into contention.
- One structural point worth stating plainly: because everything here is free, the $15/month ceiling did no work at all in this ranking. Your real cost is engineering time, and on that axis Material for MkDocs and Starlight are the cheapest by a wide margin.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
