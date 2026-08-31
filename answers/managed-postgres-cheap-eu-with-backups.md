# What's the cheapest managed Postgres in the EU with real backups?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/managed-postgres-cheap-eu-with-backups/
>
> A dated record of what one AI assistant answered when asked for managed PostgreSQL under $25 a month in an EU region, with automated daily backups and point-in-time recovery that can actually be restored, and no auto-pause on the paid tier.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:53:22 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need managed PostgreSQL for a small production app. My hard constraints are: under $25/month; EU region available; automated daily backups with point-in-time recovery I can actually restore from; no cold-start or auto-pause on the paid tier. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> The binding constraint here is not the price and it is not the EU region — it is demanding point-in-time recovery under $25 a month. PITR is the feature that hyperscaler-adjacent providers use to separate a hobby tier from a production tier, so the moment you require it, most of the sub-$25 market falls away and what remains is a short list of providers who include pgBackRest-style continuous archiving in their base product. Add "no auto-pause" and you also lose most of the serverless generation on their entry plans. DigitalOcean is where I would start.

**Bottom line:** Two or three providers genuinely clear all four constraints at once, and they do it by being unfashionable single-node managed Postgres rather than serverless anything. Whatever you pick, budget an afternoon in month one to perform a real restore into a scratch database — an untested backup is a belief, not a backup, and that test will tell you more than any comparison table including this one.

**Named, in the order named:**

1. **DigitalOcean Managed Databases for PostgreSQL** — The smallest single-node plan sits comfortably under your budget, Frankfurt and Amsterdam are both available, the instance is always on with no pause behaviour at all, and point-in-time recovery within the retention window is included in the base plan rather than sold as an add-on.
   - Pricing, as described: Fixed monthly price per node size, billed hourly up to a monthly cap. The entry-level single-node plan is the one that fits your budget; standby nodes and storage add-ons are priced separately.
   - Most likely regret: The cheapest node is genuinely small, and Postgres on a shared-CPU box with a gigabyte or so of RAM will hit a wall sooner than you expect — usually the first time you run an unindexed query against a table that has grown past memory. The upgrade path exists but involves a restart, and the price roughly doubles at each step.
   - **Model unsure:** I recall PITR being available on managed Postgres including the entry tier, with a retention window measured in days, but I am not fully confident it is not restricted to larger plans. Confirm this on the pricing page before you rely on it — it is the single claim here most worth checking.
   - _no source cited_
2. **Crunchy Bridge** — It is run by people whose entire business is Postgres, continuous WAL archiving with pgBackRest is the default rather than an upsell, and the smallest hobby-class instance has historically been priced well under your ceiling with EU regions available on the underlying cloud.
   - Pricing, as described: Per-instance hourly pricing by size plus storage, with a small entry instance intended for exactly this use case. No pause or scale-to-zero behaviour.
   - Most likely regret: It is a small company with a small company's blast radius, and the entry instance is a single node — there is no high availability at this price point, so a host failure means a restore, not a failover. You are also on a less-travelled path than the hyperscalers when something odd happens.
   - **Model unsure:** I am reasonably confident about the pricing shape but not about the current entry-instance price or which EU regions are offered today. Do not plan a budget on my recollection of the number.
   - _no source cited_
   - **Editor's note (checked 2026-08-31) — not part of the answer:** Crunchy Data, the company behind Crunchy Bridge, was acquired by Snowflake. The announcement was published on Crunchy Data's own blog on 2 June 2025 and states that "Crunchy Data is joining Snowflake to bring Postgres to the AI Data Cloud". Checked again on 31 August 2026: Crunchy Bridge is still sold as a managed Postgres service, and its pricing page is live and advertises hourly billing with "plans starting at $10/mo". This note records the change of ownership only; it does not assert that every pricing detail described above is still current.
     - Evidence: [Crunchy Data Joins Snowflake](https://www.crunchydata.com/blog/crunchy-data-joins-snowflake) (crunchydata.com)
     - Evidence: [Delivering the Most Enterprise-Ready Postgres, Built for the Snowflake AI Data Cloud](https://www.snowflake.com/en/blog/snowflake-postgres-enterprise-ai-database/) (snowflake.com)
     - Evidence: [Pricing](https://www.crunchydata.com/pricing) (crunchydata.com)
3. **Scaleway Managed Database for PostgreSQL** — A French provider with Paris, Amsterdam and Warsaw regions, which means EU data residency under an EU-headquartered company rather than an EU region operated by a US one — and its smallest development instances are among the cheapest managed Postgres you can buy.
   - Pricing, as described: Hourly per-node pricing by instance class, with cheap development-class nodes and separately billed storage and backups.
   - Most likely regret: The development-class instances are explicitly not sold as production-grade, and if you run production on one you have accepted an SLA that does not exist. Documentation in English has also historically lagged the French version and the console.
   - **Model unsure:** I am not confident that Scaleway offers true point-in-time recovery as opposed to scheduled snapshot backups on the low-cost tiers, and that distinction is exactly what you asked about. Verify it explicitly — if it is snapshots only, this option fails your third constraint and should drop off the list.
   - _no source cited_
4. **Neon (paid plan with scale-to-zero disabled)** — Its storage layer keeps a continuous history, so restoring to an arbitrary point in the retention window is a native operation rather than a backup-restore procedure, and the entry paid plan has historically been under your ceiling with EU regions available.
   - Pricing, as described: Plan-based with an included allowance of compute and storage, plus usage above it. The entry paid tier is the relevant one.
   - Most likely regret: Scale-to-zero is the default and the thing you must remember to turn off, and doing so means you are paying for compute around the clock on a plan whose economics assume you are not — you can drift over the included allowance and past $25 without a single traffic spike. The architecture is also genuinely novel, which is a strange thing to want from a database.
   - **Model unsure:** Neon's plan names, allowances and prices changed repeatedly over the period I know about, and the company was acquired, which usually precedes further repricing. Treat my description as the shape only.
   - _no source cited_
5. **Self-managed Postgres on a Hetzner VPS with pgBackRest to a Storage Box** — This is the only option on the list where you can prove the fourth constraint rather than trust it, and it is dramatically the cheapest — a small Hetzner instance in Falkenstein or Helsinki plus offsite WAL archiving costs a fraction of your ceiling and gives you real PITR to the second.
   - Pricing, as described: VPS monthly price plus a Storage Box or object-storage bucket for archives. Realistically well under half your budget for hardware that outclasses every managed entry tier above.
   - Most likely regret: You are now the DBA. Minor version upgrades, disk-full incidents, vacuum tuning, and the 3am page when the volume fills with WAL because archiving silently broke are all yours — and for a 3-person team, the hour you spend on that is an hour not spent on the product. It is the cheapest option and the most expensive one.
   - **Model unsure:** This is not a managed service and does not satisfy the literal word 'managed' in your question. I am including it because at this price point the gap between what you get here and what you get from an entry-tier managed plan is large enough that you should make the trade consciously.
   - _no source cited_
6. **Render PostgreSQL** — Frankfurt is available, the paid instances do not sleep, and if your application already runs on Render the operational simplicity of having the database next to it is worth real money to a small team.
   - Pricing, as described: Fixed monthly plans by instance size, with a low-cost entry paid tier and separately priced storage.
   - Most likely regret: Point-in-time recovery has historically been gated to plans above the cheapest one, so the tier that fits your budget may be the tier that fails your backup constraint — and you will discover this at the worst possible moment. Check which plan the PITR line actually applies to before subscribing.
   - **Model unsure:** I am not confident which Render plan tier includes PITR versus daily snapshots only, and their database plans were restructured at least once. This is the claim to verify first.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have read no current pricing page for any of these. Every price and tier boundary above is recalled, and database pricing pages are revised often. Verify all of it, and treat any specific figure I have implied as stale by default.
- Because I could not fetch anything, I cannot supply the documentation and pricing-page sources you asked for. I would rather say that outright than invent citations that look authoritative and point nowhere.
- The claim I am least sure about across this entire answer is which providers include true point-in-time recovery at their cheapest paid tier, as opposed to nightly snapshots described loosely as backups. That distinction is your third constraint, and it is the one most often blurred in marketing copy. Read the docs, not the comparison table.
- Amazon RDS, Aurora, Google Cloud SQL, Azure Database for PostgreSQL, Aiven and Timescale Cloud are all absent deliberately. Every one of them prices a production instance with PITR well above $25 a month once you include storage, backup storage and egress — the hyperscalers in particular have no meaningful sub-$25 production tier. Supabase is also absent: the Pro plan sits right at your ceiling and PITR is a paid add-on on top of it, which puts the combination over. If your ceiling is soft rather than hard, Supabase Pro plus the PITR add-on is a strong option and should go back on the list.
- None of this substitutes for testing a restore. Whichever you choose, restore a backup into a throwaway database in the first week and time how long it takes. The providers that fail this exercise are not always the ones you would predict.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
