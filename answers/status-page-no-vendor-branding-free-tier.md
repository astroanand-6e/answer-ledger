# What status page doesn't stamp the vendor's logo on my page?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/status-page-no-vendor-branding-free-tier/
>
> A dated record of what one AI assistant answered when asked for a public status page with no vendor branding and a custom domain on the free or cheapest tier, usable by a two-person team.

**Provisional entry.** Recorded while the site was being built, to demonstrate the format. The model, prompt, timestamp and answer below are real and unedited.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:20:52 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need a public status page for my SaaS. My hard constraints are: no vendor branding or "powered by" on the customer-facing page at the free or cheapest tier; custom domain included; usable by a 2-person team without a paid plan. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> Removing the vendor's branding is the single most reliable thing a hosted status page charges you for — it is the upsell that funds the free tier. So if "no branding, custom domain, no paid plan" is genuinely hard, my honest answer is that you should not buy a status page at all; you should run one. Every option I can recommend without a caveat about branding is open source.

**Bottom line:** No hosted status-page product I know of satisfies all three constraints on its free or cheapest tier. Un-branding is the paywall in this category. The options that do satisfy the constraints are all things you host yourself, and one of them costs nothing at all because it runs on free CI minutes.

**Named, in the order named:**

1. **Upptime** — It is the closest thing to a free lunch here: a repository template that runs checks on scheduled CI and publishes a static status page on free static hosting, so there is no vendor to brand it and a custom domain is just a DNS record.
   - Pricing, as described: Free and open source (MIT). Runs on your existing free CI minutes and free static hosting.
   - Most likely regret: Check frequency is bounded by how often the scheduled CI job actually fires, and scheduled CI is not punctual. If you need sub-five-minute detection, this will quietly disappoint you.
   - _no source cited_
2. **Uptime Kuma** — Self-hosted, MIT-licensed, and its public status pages are genuinely yours — your own domain, your own logo, no upsell to remove anything.
   - Pricing, as described: Free and open source. Cost is one small VPS, realistically a few dollars a month.
   - Most likely regret: It is a single container monitoring your service from one machine, and that machine is usually near your service. If the box or its network goes down you lose the monitor and the status page at the same moment — exactly when you needed them.
   - _no source cited_
3. **Gatus** — A single self-hosted Go binary configured from a YAML file you keep in git, which makes the whole status page reviewable and unbranded by default.
   - Pricing, as described: Free and open source (Apache 2.0). Self-hosted.
   - Most likely regret: The dashboard is deliberately spartan and it is not built around incident write-ups, so if you want to post a narrative postmortem on the page you will be fighting it.
   - _no source cited_
4. **Cachet** — Purpose-built as a self-hosted status page with incidents, components and scheduled maintenance, rather than as a monitor that happens to publish a page.
   - Pricing, as described: Free and open source (self-hosted).
   - Most likely regret: It does not monitor anything by itself — you still need something to detect outages and update it — and its development has been intermittent over the years.
   - **Model unsure:** I am not confident about Cachet's current maintenance status or which major version is current. Check the repository's recent activity before adopting it.
   - _no source cited_
5. **Instatus** — Named as the hosted option most likely to come closest, because it has historically been the aggressive challenger on price in this category.
   - Pricing, as described: Freemium, with a free tier and low-cost paid tiers.
   - Most likely regret: It almost certainly fails your constraints as written: a custom domain and removing the "powered by" attribution are the classic paid-tier features, and I would expect at least one of the two to require a plan.
   - **Model unsure:** I am not confident which specific features sit on Instatus's free tier today, and this is exactly the detail your question turns on. Verify it on their pricing page rather than trusting me.
   - _no source cited_
6. **Atlassian Statuspage** — Named only for completeness, as the category's incumbent and the page format your customers will recognise.
   - Pricing, as described: Free tier plus paid tiers.
   - Most likely regret: It is the clearest failure against your constraints: the free tier has historically carried Statuspage branding and no custom domain, so you would be paying to satisfy the one thing you said was non-negotiable.
   - **Model unsure:** I am confident about the shape of this restriction but not about the current details of the free tier.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have not checked a single current pricing page or free-tier feature matrix. In this category that is a serious limitation: what is and is not behind the paywall is precisely the fact you asked about, and it changes.
- For the same reason I cannot supply the source list you asked for, and I would rather say so than fabricate links.
- I am confident the four open-source projects above existed and were in use as of my knowledge cutoff. I am least confident about Cachet's current activity.
- The generalisation "un-branding is always the paywall" is my read of how this category has been priced, not something I verified vendor by vendor today. There may now be an exception I do not know about.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
