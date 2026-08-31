# What uptime monitoring gives me 1-minute checks for free?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/uptime-monitoring-one-minute-checks-free/
>
> A dated record of what one AI assistant answered when asked for uptime and SSL-expiry monitoring on five endpoints at a one-minute check interval or better without paying, with Slack and email alerting included.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:38:14 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need uptime and SSL-expiry monitoring for 5 endpoints. My hard constraints are: check interval of one minute or better without paying; alerting to Slack and email included; self-hosted options acceptable and welcome. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> The words "one minute or better" and "without paying" are the whole question, and together they knock out most of the hosted monitoring market in one move — sub-minute checking is the thing those vendors sell, so it is the thing they put behind the paywall. Free tiers in this category are overwhelmingly five-minute tiers. Once you accept that, the honest ranking is dominated by software you run yourself, and for five endpoints that is a genuinely small amount of work. Start with Uptime Kuma.

**Bottom line:** For five endpoints, self-hosting wins outright: Uptime Kuma on the cheapest VPS you can rent gives you 20-second checks, certificate-expiry warnings and both Slack and email alerting for the price of the VPS, and no vendor can move that goalpost later. The hosted free tiers are mostly five-minute tiers, which does not meet the constraint as written.

**Named, in the order named:**

1. **Uptime Kuma** — It is the exact product you described, given away: check intervals configurable down to well under a minute, TLS certificate-expiry notifications built in, and Slack and SMTP among a long list of notification channels — none of it gated, because there is no tier to gate it behind.
   - Pricing, as described: Free and open source (MIT). Your only cost is somewhere to run one Docker container; the cheapest tier at any VPS provider is more than enough for five endpoints.
   - Most likely regret: It runs on one box, so it goes down with that box, and it will not tell you it went down. Monitoring that shares a failure domain with nothing is the point — put it somewhere other than the machine your app runs on, and accept that nobody is watching the watcher unless you pay a free-tier hosted checker to ping it.
   - **Model unsure:** I am confident this project existed and was very widely used as of my knowledge cutoff. I cannot confirm its current release state or that the notification integrations I remember are all still present.
   - _no source cited_
2. **Gatus** — Checks are declared in a YAML file with an explicit interval, so a one-minute or thirty-second cadence is a line of configuration rather than a plan upgrade, and certificate expiry is expressible as an ordinary assertion alongside status code and response time.
   - Pricing, as described: Free and open source. Single Go binary or container; no hosted component you are required to buy.
   - Most likely regret: Configuration-as-code means every change to a monitor is a redeploy. That is a virtue for you and an irritation for anyone on the team who just wants to add a URL from a web form at 11pm.
   - **Model unsure:** I remember this project as actively maintained, but I have not verified its current status and cannot confirm the exact set of alerting providers shipped today.
   - _no source cited_
3. **Prometheus + Blackbox Exporter + Alertmanager** — Scrape interval is yours to set, the blackbox exporter exposes the certificate's expiry as a plain metric you can alert on days in advance, and Alertmanager has first-class Slack and email receivers — so both constraints are satisfied by configuration, permanently and for free.
   - Pricing, as described: Free and open source across all three components. Cost is the host you run them on and the hours you spend on it.
   - Most likely regret: You will spend an afternoon on YAML to get what Uptime Kuma gives you in ten minutes, and you now own three moving parts instead of one. Only worth it if you already run Prometheus for something else.
   - _no source cited_
4. **Better Stack (Uptime)** — Of the hosted options, this is the one I most associate with genuinely sub-minute checking on a free tier rather than five-minute checking, with Slack and email alerting included rather than sold as an add-on.
   - Pricing, as described: Freemium: a free tier with a limited number of monitors, then paid plans priced per monitor or per plan tier above it.
   - Most likely regret: Free-tier check frequency is precisely the lever this kind of vendor pulls when it needs revenue, and you will find out it moved when your five monitors quietly drop to a slower cadence.
   - **Model unsure:** I am not confident about this product's current free-tier limits, its current check interval, or even that it is still branded this way — it has been renamed at least once. I am deliberately not quoting monitor counts or intervals. Read the pricing page before you depend on it.
   - _no source cited_
5. **UptimeRobot** — The best-known free uptime monitor, with a generous monitor count and both email and Slack alerting, and it will monitor certificate expiry for you.
   - Pricing, as described: Freemium: a free tier with a large number of monitors at a slower check interval, with faster intervals sold on paid plans.
   - Most likely regret: The free interval is the problem, not the monitor count. My recollection is that free checks run at five minutes and that one-minute checking is a paid feature — which fails your constraint outright. It is on this list because it is the obvious name to consider and I would rather tell you why it does not fit than leave you to discover it.
   - **Model unsure:** I am not confident of the current free-tier interval. It has changed before and it may have changed again in either direction.
   - _no source cited_
6. **Healthchecks.io** — Open source and self-hostable under a permissive licence, free hosted tier, Slack and email alerting included — and it solves the failure your other monitors cannot see, which is a cron job or worker that silently stopped running.
   - Pricing, as described: Free and open source to self-host; the hosted service has a free tier and paid plans above it.
   - Most likely regret: It is the wrong shape for this job. It waits for your systems to check in rather than probing your endpoints from outside, so it will not tell you your TLS certificate expires in a week. Run it alongside Uptime Kuma, not instead of it.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have not read a single current pricing page or free-tier limit. Every interval and tier description above is recalled, not verified, and check-interval limits on free tiers are among the fastest-moving facts in this category.
- Because I could not fetch anything, I cannot supply the documentation and pricing sources you asked for. I would rather say that plainly than invent citations that look authoritative.
- I am confident all six of these projects and services existed and were in active use as of my knowledge cutoff. I cannot confirm any of them still is today, and Better Stack in particular has changed its name and packaging before.
- Several obvious names are absent on purpose rather than by oversight: Pingdom, Datadog Synthetics, New Relic Synthetics and StatusCake all do this job well, and all of them either have no free tier at a one-minute cadence or bundle it into a platform subscription. Your "without paying" constraint is what excludes them, not their quality.
- One thing I cannot judge from here is check-location diversity. Free tiers usually probe from fewer regions, and a self-hosted checker probes from exactly one. If you need to distinguish "our site is down" from "our site is down from Frankfurt", none of the free answers above is sufficient on its own.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
