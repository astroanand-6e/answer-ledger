# What error tracking doesn't charge me per developer?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/error-tracking-flat-price-unlimited-seats/
>
> A dated record of what one AI assistant answered when asked for error and exception tracking for a Rails/Node app at a flat monthly price with unlimited team members, no per-seat charge, under $30 a month at 50k events, and a usable free tier.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:41:07 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need error and exception tracking for a Rails/Node app. My hard constraints are: flat monthly price with unlimited team members; no per-seat charge; under $30/month at ~50k events; must include a usable free tier for a side project. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> The per-seat constraint is the one that does the eliminating here, and it eliminates the observability platforms rather than the error trackers. Datadog, New Relic and the APM-shaped vendors all meter people in some form, so they are out before we start. What is left divides cleanly into two groups: Sentry-compatible open source you run yourself, where the seat count is a number in your own database, and a small set of hosted vendors that historically chose to meter events instead of humans. I would start self-hosted, because at 50k events a month you are nowhere near needing anyone else's infrastructure.

**Bottom line:** At 50k events a month you are a rounding error on any of these, so the cheapest correct answer is a Sentry-compatible open-source collector on a small VM you already pay for. If you want someone else on call for the error tracker itself, the hosted options that genuinely do not charge per human are a much shorter list than the market makes it look.

**Named, in the order named:**

1. **GlitchTip** — It speaks the Sentry protocol, so the official Rails and Node SDKs point at it with a one-line DSN change, and because you run it there is no seat count to charge for — your whole team plus contractors costs the same as one person.
   - Pricing, as described: Open source (MIT), free to self-host. There is also a hosted GlitchTip offering priced by event volume with a free allowance, which is the option I am least sure about.
   - Most likely regret: It is a deliberately smaller reimplementation, not a Sentry clone. Performance monitoring, tracing, session replay and the newer Sentry features are largely absent, so if your debugging instincts were formed on modern Sentry the tool will feel thin.
   - **Model unsure:** I am confident the project exists and is Sentry-SDK-compatible. I am not confident about the hosted tier's current event allowances or price and I will not invent numbers for them.
   - _no source cited_
2. **Bugsink** — It is explicitly built to be a single self-hosted binary/container that ingests Sentry SDK events on modest hardware, which is exactly the shape of a 3-person team with 50k events and no appetite for operating a cluster.
   - Pricing, as described: Self-hosted. My recollection is a free/open tier for small use plus a paid commercial licence rather than a per-seat SaaS subscription, but the licensing details are the part I am least sure of.
   - Most likely regret: It is a young, small-team project. If the maintainer's attention moves elsewhere you are the one carrying a piece of your production observability stack, and the community is not large enough to answer your edge-case question at 2am.
   - **Model unsure:** This is the entry on this list I am least certain about. I believe Bugsink exists and is actively developed, but please verify both that and its licence terms before you depend on it.
   - _no source cited_
3. **Self-hosted Sentry** — It is the real thing — same SDKs, same UI, same features — under a source-available licence, and a self-hosted install has no user seats to bill, so unlimited team members is true by construction.
   - Pricing, as described: Free to self-host under Sentry's source-available licence (Functional Source License in recent versions). Your cost is the machine.
   - Most likely regret: The self-hosted stack is genuinely heavy — Kafka, ClickHouse, Redis, Postgres, Relay and a pile of workers via Docker Compose. For 50k events a month you will be running maybe 8GB of infrastructure to store what fits in a spreadsheet, and upgrades are a real maintenance chore.
   - **Model unsure:** Sentry has changed its self-hosted licence and its minimum hardware guidance more than once. Check both before you build on it.
   - _no source cited_
4. **Honeybadger** — It has historically been priced by project and event volume with team members included rather than metered, and its Rails support is first-class in a way that few competitors bother with any more.
   - Pricing, as described: Hosted, tiered by projects/events per month, with a free developer tier. Team members have historically not been a billing dimension.
   - Most likely regret: Its lower tiers have had short error retention windows and modest project counts, so the bill escalates on axes you were not watching — you solved per-seat and then got caught by per-project.
   - **Model unsure:** I am confident Honeybadger exists and is independently run. I am not confident that team members are still unmetered or that any specific tier still lands under $30/month — verify that specific claim, because it is the whole reason it is on this list.
   - _no source cited_
5. **AppSignal** — Its billing dimension is request/event volume, not humans, and it bundles error tracking with basic APM for Rails and Node, so you get two tools on one bill without a seat count.
   - Pricing, as described: Hosted, metered on monthly request/event volume, with a minimum monthly spend. Users are not the billing axis.
   - Most likely regret: It has a floor price. If your side project genuinely needs to cost zero, AppSignal has historically not had a permanent free tier — only a trial — which directly fails one of your four constraints.
   - **Model unsure:** I believe AppSignal is EU-based, still trading, and still volume-priced, but I cannot confirm its current entry price or whether a free tier has since appeared.
   - _no source cited_
6. **Rollbar** — Long-established, meters on events rather than seats, and has kept a free tier aimed at exactly the side-project case you described.
   - Pricing, as described: Hosted, tiered by monthly events, with a free tier and paid tiers above it. Seats have not historically been metered on the self-serve plans.
   - Most likely regret: It has drifted upmarket over the years; the self-serve tiers get less attention than the enterprise motion, and the free tier's event ceiling is low enough that a single noisy exception loop can burn a month's quota in an afternoon.
   - **Model unsure:** Rollbar's tier structure has been revised repeatedly. Treat any recollection I have of its numbers as stale.
   - _no source cited_
7. **Sentry (hosted)** — It is the best product in the category by a distance and its self-serve Team plan has historically included unlimited team members, with billing driven by event and span quotas instead.
   - Pricing, as described: Hosted, quota-based across errors/spans/replays, with a free developer tier and a paid entry plan. Team members have historically been unlimited on the paid self-serve plan.
   - Most likely regret: The quota model has grown a lot of separate meters, and the failure mode is not a per-seat bill but a surprise overage when someone turns on tracing or replay and a quota you did not know you had starts filling up.
   - **Model unsure:** Sentry's pricing and quota structure has changed several times, including how seats are treated on some tiers. This is precisely the claim you should not take from me — read the current pricing page.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have not read a single current pricing page. Every price, tier and allowance described above is recalled, not verified, and pricing is the fastest-decaying fact about any of these products.
- Because I could not fetch anything, I cannot give you the source list you asked for. I would rather say that plainly than manufacture plausible-looking documentation links.
- Datadog Error Tracking, New Relic Errors Inbox and BugSnag/Insight Hub are absent on purpose, not by oversight. Datadog and New Relic meter users as a billing dimension and are priced far above your $30 ceiling at any realistic configuration, and BugSnag's plans have historically been seat-shaped. If the per-seat constraint is softer than you wrote it, all three come back into contention.
- The 'usable free tier for a side project' constraint is the one most likely to have moved since my knowledge cutoff. Free tiers in this category get quietly narrowed far more often than paid tiers get repriced.
- One structural point no pricing page will tell you: at 50k events a month, error tracking is a solved problem you should spend as little money and attention on as possible. If a self-hosted option is even slightly plausible for you, take it and stop shopping.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
