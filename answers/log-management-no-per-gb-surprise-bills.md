# What log management won't hand me a surprise bill?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/log-management-no-per-gb-surprise-bills/
>
> A dated record of what one AI assistant answered when asked for centralised log management for three small services with a hard billing ceiling or flat price, at least seven days of retention, and self-hosted options treated as first-class.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:41:07 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need centralised log management for 3 small services. My hard constraints are: no usage-based pricing that can spike without a hard cap; I want a hard ceiling or a flat price; retention of at least 7 days; self-hosted options acceptable. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> "No usage-based pricing that can spike without a hard cap" eliminates the entire top of the observability market, because per-GB-ingested billing with no ceiling is the log management business model — the vendors you have heard of are precisely the ones that fail this constraint. What is left is self-hosted software, where your bill is a disk you already bought, plus a small number of hosted products that sell fixed plans and stop ingesting rather than stop billing. For three small services the volume is almost certainly trivial, and the honest first answer is to run it yourself: start with VictoriaLogs.

**Bottom line:** For three small services, self-hosting is not the compromise answer, it is the correct one — the data volume is too small to justify a vendor relationship that can bill you unboundedly. If you insist on hosted, buy a fixed plan that throttles at the cap rather than one that invoices past it, and verify the throttling behaviour in writing before you send it production traffic.

**Named, in the order named:**

1. **VictoriaLogs** — A single static binary with no external dependencies that indexes logs with far lower CPU and disk appetite than the alternatives, so three small services fit comfortably on a box you are already paying for and your log bill becomes a fixed line item you control.
   - Pricing, as described: Free and open source. Cost is whatever the VM and its disk cost you; retention is a flag you set, so 7 days or 90 days is your decision, not a plan tier.
   - Most likely regret: The ecosystem around it is thin compared to the Elastic and Grafana worlds. If you want a pre-built dashboard, an off-the-shelf alerting recipe or a Stack Overflow answer, you will more often find nothing and have to work it out from the docs yourself.
   - **Model unsure:** This project was young and moving fast as of my knowledge cutoff. I am confident it existed and was actively developed; I cannot confirm its current maturity, query language details, or that the operational story has not changed.
   - _no source cited_
2. **Grafana Loki (self-hosted)** — It stores log content in cheap object storage and indexes only labels, so a hard ceiling on cost is achievable by construction — you pay S3-or-equivalent storage rates and nothing per gigabyte ingested to anyone.
   - Pricing, as described: Free and open source under AGPLv3. Self-hosted cost is object storage plus the compute you run it on. Grafana Cloud sells a hosted version separately with its own usage-based model.
   - Most likely regret: Label cardinality. Loki punishes you for putting a high-cardinality value — a user ID, a request ID — into a label, and you will not find out until queries crawl and the index bloats. Grepping across a wide time range on a small box is also genuinely slow.
   - **Model unsure:** Grafana Cloud's free tier historically included a meaningful log allowance, but I do not trust my memory of its current limits and will not quote a number.
   - _no source cited_
3. **Plain files: journald or rsyslog on one box, read with lnav** — For three small services this is very likely sufficient, and it is the only option on this list with a strictly zero marginal cost and no software you did not already have — ship logs to one host over syslog, rotate them, keep 7 to 30 days, and read them with lnav or ripgrep.
   - Pricing, as described: Free. It is the operating system you are already running.
   - Most likely regret: There is no search-as-you-type, no dashboard, no alerting, and no structured querying across services. The day you are debugging a production incident at 2am and want to correlate three services by request ID, you will feel the absence sharply and wish you had set up something real.
   - _no source cited_
4. **SigNoz (self-hosted)** — Self-hostable, OpenTelemetry-native, and gives you logs, traces and metrics in one UI, which matters more than it sounds when a 3-person team would otherwise be operating three separate systems.
   - Pricing, as described: Open-source core, free to self-host. There is a separate paid cloud product with its own usage-based pricing.
   - Most likely regret: It rides on ClickHouse, and self-hosting SigNoz really means self-hosting ClickHouse. That is a heavier operational commitment than the honest size of your problem — expect it to want more RAM than you budgeted.
   - **Model unsure:** I am not confident about the current licence terms of the open-source distribution or which features sit behind the paid edition. Check that before you build on it.
   - _no source cited_
5. **Papertrail** — Historically the clearest example of the pricing shape you asked for: flat monthly plans with a fixed monthly search-volume allowance, where exceeding the allowance stops indexing rather than generating an overage invoice — a genuine hard ceiling rather than a soft one.
   - Pricing, as described: Flat monthly tiers by log volume, with a small free tier. Retention and searchable volume both scale with the tier.
   - Most likely regret: The product has been in maintenance mode under SolarWinds ownership for a long time. The UI is dated, structured-log querying is weak, and you are betting a production dependency on something that reads like it is being quietly wound down.
   - **Model unsure:** I am genuinely unsure whether Papertrail is still sold, still accepting new customers, or has been folded into another SolarWinds product. Confirm it exists before planning around it.
   - _no source cited_
6. **Axiom** — Built on cheap columnar object storage rather than hot indices, which historically let it offer an unusually generous free tier and a low flat entry plan — for three small services you may never leave the free tier at all.
   - Pricing, as described: Free tier plus paid plans; historically plan-based with an included ingest allowance rather than pure pay-per-GB.
   - Most likely regret: The free tier is the whole reason it is on this list, and free tiers on venture-funded infrastructure products are the least durable fact in software. If they reprice, you are migrating your logging pipeline on their schedule, not yours.
   - **Model unsure:** Axiom changed its pricing and free-tier allowances at least once that I am aware of, and I do not know the current structure. Treat everything above as a description of its shape, not its numbers.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have not read a single current pricing page. Every pricing description above is recalled from memory, and log-management pricing changes faster than almost any other category in infrastructure. Verify before you commit.
- Because I could not fetch anything, I cannot give you the documentation and pricing-page list you asked for. I would rather tell you that plainly than manufacture plausible-looking citations.
- Datadog Logs, New Relic, Splunk, Sumo Logic, Logz.io and Better Stack are absent on purpose, not by oversight. All of them are fundamentally priced on ingested or indexed volume, and while several offer spending alerts or quotas, an alert is not a hard cap — a misbehaving loop in a retry handler can still produce a four-figure invoice. Your first constraint excludes them. If you would accept a soft cap plus vigilance, Datadog in particular comes straight back into contention.
- I have not accounted for the cost of your own time. Self-hosting is free in dollars and expensive in attention, and for a 3-person team that trade is real. The reason I still rank it first is that three small services produce a log volume where the operational burden is measured in hours per quarter, not per week.
- I am confident all six of these existed and were actively used as of my knowledge cutoff. I am least confident about Papertrail still being available, and about VictoriaLogs' current feature set given how quickly it was moving.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
