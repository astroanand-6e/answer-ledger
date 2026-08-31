# What feature flag tool won't lock me into a vendor SDK?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/feature-flags-no-sdk-lock-in/
>
> A dated record of what one AI assistant answered when asked for feature flags and gradual rollouts with no proprietary SDK lock-in, a self-hosted option, no per-seat pricing, and a budget under $20 a month.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:41:12 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need feature flags and gradual rollouts. My hard constraints are: no proprietary SDK lock-in — open format or trivially replaceable; free or under $20/month for a small team; self-hosted option available; no per-seat pricing. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> The "no per-seat pricing" and "self-hosted option" constraints together knock out the category leader before we start, and the SDK lock-in constraint changes the shape of the question entirely: you are not really shopping for a flag service, you are shopping for a flag evaluation contract that you can re-point at something else in an afternoon. That reframing has an answer, and it is a standard: OpenFeature. Pick your provider second, and pick it knowing you can swap it.

**Bottom line:** Adopt OpenFeature as your interface first — that single decision satisfies the lock-in constraint no matter what you put behind it. Then run Flagsmith, Unleash or GrowthBook yourself on hardware you are already paying for, and your recurring cost for flags is zero.

**Named, in the order named:**

1. **OpenFeature** — It is not a flag vendor at all — it is a vendor-neutral SDK specification with providers for most of the major backends, so your application code never imports a vendor's client and swapping providers becomes a config change rather than a migration.
   - Pricing, as described: Free. It is an open-source specification and SDK set under the CNCF, with no hosted component to buy.
   - Most likely regret: It is an abstraction layer, and abstraction layers lag. When a provider ships a feature you want, the OpenFeature provider for it may not expose that feature yet, and you will be tempted to reach past the interface — which quietly reintroduces exactly the lock-in you adopted it to avoid.
   - **Model unsure:** I am confident OpenFeature exists and is CNCF-hosted, but I cannot verify from here which providers are currently maintained at what quality. Provider maturity varies a lot and that is the thing worth checking.
   - _no source cited_
2. **Flagsmith** — Open-source core you can run yourself with unlimited flags and no user-count licence, and the API it exposes is simple enough that reimplementing a client against it is an evening's work — which is the practical definition of "trivially replaceable".
   - Pricing, as described: Self-hosted open-source edition: free. There is also a hosted cloud offering with a free tier and paid plans above it; the paid plans have historically had a seat component, which is why I am ranking the self-hosted path.
   - Most likely regret: Self-hosting it means running a Django application plus Postgres plus, if you want the fast local-evaluation path, an edge component. That is a real service to keep alive for something as boring as booleans.
   - **Model unsure:** I am not confident about Flagsmith Cloud's current tier structure or whether the free tier still covers a 3-person team, and I will not guess at the numbers. Read their pricing page.
   - _no source cited_
3. **Unleash** — The open-source edition is genuinely capable rather than a crippled demo — gradual rollouts, percentage strategies and constraints are all in the free self-hosted product, not held back for the paid tier.
   - Pricing, as described: Open-source self-hosted edition: free. Unleash's commercial tiers are separate and have historically been priced with a seat component, so the constraint you wrote points you at the open-source edition specifically.
   - Most likely regret: The split between what is open source and what is enterprise moves, and the features that tend to sit on the commercial side are the governance ones — approvals, audit, SSO. If your company grows into wanting those, you will be having the pricing conversation you were trying to avoid.
   - **Model unsure:** I believe Unleash's OSS/enterprise feature split has changed at least once. Do not take my characterisation of which side a given feature sits on without checking.
   - _no source cited_
4. **GrowthBook** — Its SDKs evaluate flags locally against a plain JSON payload the server hands you, which means the actual dependency is a documented JSON shape rather than a vendor runtime — you could serve that payload from your own S3 bucket and keep working if GrowthBook vanished tomorrow.
   - Pricing, as described: Open-source (MIT) self-hosted edition: free. There is a hosted cloud with a free tier for small teams and paid plans above it.
   - Most likely regret: GrowthBook's centre of gravity is A/B testing and statistics, not flag operations. If all you want is a kill switch and a 10% rollout, you are adopting a warehouse-connected experimentation platform to get it, and most of the product will sit unused.
   - **Model unsure:** I am not confident of GrowthBook Cloud's current free-tier user limit and am deliberately not quoting one.
   - _no source cited_
5. **Flipt** — It is the smallest thing on this list that still counts as a flag service: a single Go binary, and it can read flag definitions declaratively from files in a Git repository, so your flag state is version-controlled text you already own.
   - Pricing, as described: Open source, free to self-host. Any commercial offering is secondary to the self-hosted binary.
   - Most likely regret: Small project, small ecosystem. The UI is spartan, the integrations you assume exist may not, and if the maintainers move on you are the maintainer.
   - **Model unsure:** I am moderately confident Flipt is still actively developed, but of everything on this list it is the one I would most want you to confirm is alive before building on it.
   - _no source cited_
6. **PostHog feature flags** — Priced by usage rather than by seat, with a free monthly allowance that a 3-person company's traffic will plausibly fit inside — so it can genuinely cost you nothing while remaining a hosted product you do not operate.
   - Pricing, as described: Usage-based with a free monthly allowance of flag requests; you pay only above it. Team members are not charged for. There is also a self-hostable open-source edition, though it is a much heavier thing to run than the others here.
   - Most likely regret: Usage pricing has no ceiling. Feature flags get evaluated on every page load, so a traffic spike or a badly placed evaluation in a render loop turns into a bill rather than a rate limit, and you find out afterwards.
   - **Model unsure:** PostHog's free allowances have been revised repeatedly. Treat any figure from me as stale on principle.
   - _no source cited_
7. **A JSON file in your own repository** — For a 3-person company shipping a handful of rollouts a month, a checked-in config file plus a percentage-hash helper function satisfies every constraint you listed absolutely, and costs nothing to run or to leave.
   - Pricing, as described: Free. It is thirty lines of your own code.
   - Most likely regret: Every flag change is a deploy. The first time you need to kill a broken feature at 3am and your CI pipeline takes eleven minutes, you will understand precisely what the vendors are selling — and you should switch then, not before.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have read no current pricing page for any product named above. Every pricing description is recalled from training data, and pricing is the single fastest-decaying fact about a software product. Verify before you commit.
- Because I could not fetch anything, I cannot supply the list of documentation and pricing pages you asked for. I would rather tell you that than invent plausible-looking citations.
- Several of these projects draw a moving line between their open-source and commercial editions. My description of which features sit on which side is the claim most likely to be wrong, more so than the prices.
- LaunchDarkly is absent on purpose, not by oversight: it is the strongest product in this category and it is exactly what your constraints exclude — seat-influenced pricing well above $20/month, no self-hosted option for a small team, and a rich proprietary SDK that is the main thing you would be buying. Split.io, Statsig and similar hosted-only vendors are omitted for related reasons. If the self-hosting and per-seat constraints are softer than you wrote them, LaunchDarkly re-enters at the top immediately.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
