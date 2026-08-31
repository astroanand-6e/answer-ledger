# Where can I host API docs generated from my OpenAPI spec for free?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/api-docs-from-openapi-free-hosting/
>
> A dated record of what one AI assistant answered when asked where to host API reference documentation generated automatically from an OpenAPI spec, for free or under $20 a month, with a custom domain and no per-seat pricing.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 17:06:44 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need hosted API reference documentation generated from an OpenAPI/Swagger spec. My hard constraints are: free or under $20/month; generated automatically from the spec in my repo on every push; custom domain; no per-seat pricing. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> Your budget line does most of the work here: under $20 a month with a custom domain rules out ReadMe, SwaggerHub, Stoplight's hosted platform and the paid tiers of every developer-portal vendor, all of which start at multiples of that and several of which are priced per seat on top. But this is one of the categories where being priced out is a gift, because API reference from an OpenAPI spec is a solved static-site problem. A CI job renders the spec to HTML and a static host serves it, and the whole thing costs nothing and cannot be repriced. Everything below is a variation on that theme, ranked by how little you will have to think about it.

**Bottom line:** Run a Redocly CLI or Scalar build step in GitHub Actions and publish the output to GitHub Pages or Cloudflare Pages on your own domain. It is free, it regenerates on every push by construction, there are no seats to buy, and no vendor is in a position to change the deal later.

**Named, in the order named:**

1. **Redocly CLI + GitHub Pages** — Redoc's open-source renderer produces the best-looking API reference of any free option, the CLI emits a single self-contained HTML file, and GitHub Pages serves it on a custom domain with free TLS and no notion of seats.
   - Pricing, as described: Redocly CLI is free and open source (MIT); Redoc's community renderer is open source. GitHub Pages is free on public repositories and included with paid GitHub plans for private ones. Redocly also sells a hosted commercial platform, which is not what this recommendation is.
   - Most likely regret: The open-source Redoc renderer is deliberately the cut-down sibling of the paid product. The things you will eventually want — try-it-out request execution, multiple API versions in one portal, search across guides and reference — are the things held back for the commercial tier, and you will notice their absence about six months in.
   - **Model unsure:** Redocly has repeatedly shifted which capabilities live in the free CLI versus the paid platform. I am confident the CLI can build static reference docs for free; I would verify the current feature split before promising anything specific to a customer.
   - _no source cited_
2. **Scalar** — An open-source OpenAPI reference renderer that ships a working try-it-out client in the free build — the single feature Redoc's community edition withholds — and can be embedded as a script tag or built as a static bundle in CI.
   - Pricing, as described: The renderer is free and open source (MIT). Scalar also runs a hosted product with free and paid tiers; self-hosting the renderer is the free path and the one that satisfies your constraints without depending on their pricing.
   - Most likely regret: It is much younger than Redoc or Swagger UI. The rendering of unusual OpenAPI constructs — deep oneOf/allOf composition, discriminators, callbacks, webhooks — is where young renderers break, and if your spec is complicated you may discover this after you have already pointed docs.yourdomain.com at it.
   - **Model unsure:** I am reasonably confident the project is active and MIT-licensed, and not at all confident about the current shape of their hosted tiers. Do not plan around the hosted free tier without reading the pricing page.
   - _no source cited_
3. **Swagger UI on Cloudflare Pages** — The most boring possible answer and therefore the most durable one: Swagger UI is Apache-2.0, has rendered OpenAPI for over a decade, and Cloudflare Pages gives you Git-connected builds, a custom domain and free TLS with no seat count anywhere in the model.
   - Pricing, as described: Swagger UI is free and open source. Cloudflare Pages has a free tier with unlimited requests and a monthly build-count limit that a docs site will not come close to.
   - Most likely regret: It looks like Swagger UI. Every developer who lands on it recognises the default theme instantly, and it reads as "we did the minimum" in a way that a polished reference does not. Theming it beyond the surface is more work than switching renderers.
   - **Model unsure:** Do not confuse Swagger UI, the free open-source renderer, with SwaggerHub, the paid per-seat platform from the same lineage. The first satisfies your constraints; the second is exactly what your constraints exclude.
   - _no source cited_
4. **Stoplight Elements** — Stoplight's open-source web component renders an OpenAPI spec as a polished three-panel reference that you host yourself, which gets you the visual quality of a commercial developer portal without the commercial developer portal's per-seat bill.
   - Pricing, as described: The Elements component is free and open source. Stoplight's hosted platform is a separate paid product well above your ceiling.
   - Most likely regret: It is a component, not a product. You are responsible for the page around it, the build step, the routing and the upgrades, and maintenance attention on open-source components published by companies whose real business is the paid platform is structurally unreliable.
   - **Model unsure:** Stoplight was acquired by SmartBear, and I am not confident about the current maintenance status or roadmap of the open-source Elements component under that ownership. Check the repository's recent commit activity before adopting it.
   - _no source cited_
5. **Docusaurus + docusaurus-plugin-openapi-docs** — The right answer if you will eventually want guides and tutorials next to the reference rather than reference alone: Docusaurus gives you a real documentation site, and the OpenAPI plugin generates reference pages from your spec as part of the same build.
   - Pricing, as described: Both are free and open source. Hosting is a free static host of your choice.
   - Most likely regret: You have adopted a JavaScript documentation framework and a community plugin that has to track both Docusaurus major versions and the OpenAPI specification. Upgrade weekends are real, and the plugin lagging a Docusaurus major release is a well-worn way to lose a day.
   - **Model unsure:** There have been several similarly named OpenAPI plugins for Docusaurus over the years with different maintainers. Confirm which one is currently maintained before you build on it.
   - _no source cited_
6. **Bump.sh** — The strongest hosted option specifically for your workflow, because it is built around pushing a spec from CI on every commit and it does useful things nobody else does — notably diffing your API between deploys and showing consumers what changed.
   - Pricing, as described: Subscription per documented API rather than per seat, with a free tier that has historically covered open-source or public APIs.
   - Most likely regret: It is the only entry here where somebody else can change your price. Per-API pricing is fine at one API and less fine when you split into three, and you are hosting your public developer surface on a small vendor's infrastructure.
   - **Model unsure:** I am not confident that Bump.sh's free tier still covers a commercial private API, or what the current paid entry point costs. This is the entry on this list I would verify first, and I will not guess at a figure.
   - _no source cited_
7. **Mintlify** — By some distance the best-looking documentation product in this space, with Git-connected builds and OpenAPI reference generation from a spec in your repo, and a free tier that has historically included a custom domain.
   - Pricing, as described: Free tier for a single editor with paid plans above it. The paid plans are priced per editor seat, which is the model you excluded.
   - Most likely regret: The free tier is a single-editor tier, so the moment a second person on a three-person team needs to edit docs you are into per-seat pricing at a level well above $20 a month. You will have built your public documentation on a product whose next step is priced for funded startups.
   - **Model unsure:** Mintlify's free-tier terms and paid pricing have changed repeatedly and quickly. Everything I have said about its tiers should be treated as probably stale.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have read no current pricing page and no current documentation. The two hosted entries at the bottom of this list are the ones where that matters most; the open-source ones above them are stable in a way that vendor pricing is not.
- Because I could not fetch anything, I cannot give you the source list you asked for, and I would rather state that than fabricate links to docs pages I have not opened.
- On "generated on every push": none of the open-source entries do this by themselves. They are renderers. The regeneration is a GitHub Actions workflow you write — spec changes, action runs the CLI, output is published — and it is roughly twenty lines of YAML you will never touch again. Budget an afternoon for it, once.
- ReadMe, SwaggerHub, Stoplight's hosted platform, Postman's public API documentation and Redocly's own hosted portal are all absent on purpose. Each of them is either priced per seat, priced well above $20 a month for a commercial API, or both. They are genuinely better products than a static Redoc build; your constraints simply exclude them, and at three people that is the right trade.
- If your spec is unusually large or uses recent OpenAPI 3.1 features heavily, renderer choice stops being cosmetic. Render your actual spec with two or three of these locally before you commit to one — it takes an hour and it is the only test that matters.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
