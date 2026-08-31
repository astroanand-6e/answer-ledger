# What analytics can I run in the EU with no cookie banner?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/analytics-eu-hosted-no-cookie-banner/
>
> A dated record of what one AI assistant answered when asked for website analytics with data stored in the EU, genuinely cookieless so no consent banner is required, under $20 a month or self-hostable on a $5 VPS, and no per-seat pricing.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:58:33 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need website analytics for a marketing site and app. My hard constraints are: data stored in the EU; genuinely cookieless so no consent banner is required; under $20/month or self-hostable on a $5 VPS; no per-seat pricing. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> Two of your constraints do almost all the eliminating. EU storage rules out the entire US analytics industry as a default, and 'genuinely cookieless' rules out every product whose identity model is a first-party cookie — which is most of the product analytics category. What survives is a small, mostly European, mostly open-source cluster of tools that count visits by hashing request attributes daily rather than storing anything on the device. Before the list, one correction to the premise: cookieless does not automatically mean consent-free.

**Bottom line:** Every tool below is a defensible answer; the $5 VPS constraint is what separates them, because the best-known option in this space needs a ClickHouse instance and your budget does not. Self-host Umami or GoatCounter if the constraint is literal, and pay a European vendor twenty euros if you would rather not.

**Named, in the order named:**

1. **Umami** — It is the only strong option in this category that genuinely runs on a $5 VPS, because it needs nothing but Node and a Postgres or MySQL database you probably already have — and self-hosting makes EU storage a decision you make rather than a promise you accept.
   - Pricing, as described: Open source (MIT), free to self-host. There is also Umami Cloud with a free tier and a paid tier priced by monthly events rather than by user.
   - Most likely regret: It is an analytics dashboard, not an analytics practice. Funnels, retention and segmentation are shallow or absent compared with what you would get from a real product-analytics tool, and when you eventually need to answer a hard question about a signup flow it will not be able to.
   - **Model unsure:** I am confident the open-source project exists and is actively developed. I am not confident about Umami Cloud's current tier boundaries or region options and I am not going to guess at them.
   - _no source cited_
2. **Plausible Analytics** — It is the reference implementation of the whole category: cookieless by design, EU-hosted and EU-owned as a company, priced by monthly pageviews with team members included rather than metered, and open source if you want to leave.
   - Pricing, as described: Hosted plans tiered by monthly pageviews, with the entry tier historically around ten euros a month for a small site and unlimited team members. Plausible Community Edition is AGPL and free to self-host.
   - Most likely regret: Self-hosting it is not a $5 VPS job — Community Edition wants ClickHouse alongside Postgres, which is a real memory footprint for a machine that size. So in practice this option costs you the subscription, not zero.
   - **Model unsure:** Plausible has restructured its self-hosted offering at least once, renaming and re-scoping what used to be the self-hosted build. Confirm what Community Edition includes today before planning around it.
   - _no source cited_
3. **Pirsch Analytics** — A German company with German hosting and a cookieless, hash-based counting model built specifically so that customers can drop the consent banner — which is the exact combination of your first two constraints, sold as the product.
   - Pricing, as described: Hosted, tiered by monthly pageviews, with an entry tier in the region of a few euros a month. Team members have not historically been a billing axis. There is also a self-hostable component.
   - Most likely regret: It is a small vendor with a small team. The bus factor is real, and if it is acquired or shut down your historical data is on someone else's server in a format you did not choose.
   - **Model unsure:** I am reasonably confident Pirsch exists and is German-hosted. I am not confident of its current price points and would not quote a figure I had not just read.
   - _no source cited_
4. **Simple Analytics** — Dutch company, EU data storage, explicitly cookieless and explicitly marketed as not requiring a banner, with plans priced on pageviews rather than seats.
   - Pricing, as described: Hosted, tiered by monthly pageviews. My recollection is that the entry tier sits near or slightly under your twenty-dollar ceiling, which makes it the constraint most worth checking.
   - Most likely regret: It is the most deliberately minimal tool on this list. That is the point, but on an app — as opposed to a marketing site — you will quickly want event properties and user-level questions that it will not answer.
   - **Model unsure:** Prices in this segment have crept upward. Treat my sense of where the entry tier lands as unreliable.
   - _no source cited_
5. **GoatCounter** — It is a single Go binary with SQLite that will run on a $5 VPS with room to spare, is cookieless by design, and the hosted version has historically been free for non-commercial use with a pay-what-you-can model.
   - Pricing, as described: Open source, free to self-host. Hosted service has historically been free for personal and small use with optional paid support.
   - Most likely regret: It is essentially one person's project, and it is closer to a hit counter with good manners than to an analytics product. For a marketing site that is fine; for an app it will not carry you.
   - **Model unsure:** I am not confident about the current status of the hosted service or whether commercial use is still eligible for the free tier. Verify that before pointing a company site at it.
   - _no source cited_
6. **Matomo (self-hosted)** — It is the only tool on this list with genuinely deep analytics capability that you can still run entirely on your own EU hardware, and it can be configured into a cookieless, IP-anonymised mode that several European DPAs have treated as consent-exempt.
   - Pricing, as described: Self-hosted core is free and open source (GPL). Matomo Cloud is a paid hosted service, and several plugins are paid separately. Matomo Cloud is priced by hits, not by seat.
   - Most likely regret: The cookieless configuration is something you have to correctly assemble — disable cookies, anonymise IPs, disable the user-id feature, set the right retention — and it is not the default. Get one switch wrong and you have quietly built the banner-requiring thing you were avoiding.
   - **Model unsure:** The specific configuration recognised as consent-exempt has been described differently by different national regulators and has changed over time. This is the item on the list where I would least trust my recollection.
   - _no source cited_
7. **Fathom Analytics** — Flat pricing by pageview with unlimited sites and unlimited team members, cookieless, and it markets an EU isolation setup that keeps European visitors' processing on EU-owned infrastructure.
   - Pricing, as described: Hosted, flat monthly tiers by pageview volume, with all sites and all team members included. Entry tier has historically been in the mid-teens per month.
   - Most likely regret: The company is Canadian, and 'EU isolation' is a processing arrangement rather than the simple fact of an EU-only company holding EU-only data. If your constraint exists because a customer's DPA questionnaire asks it, you will be writing a paragraph of explanation rather than checking a box.
   - **Model unsure:** I am listing this last precisely because I am not confident it clears your EU-storage constraint as literally written, and I would rather flag that than rank it higher and let you find out during a security review.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have read no current pricing page, no current data-processing addendum and no current regulator guidance. Everything above is recalled, and both prices and privacy claims in this category move quickly.
- Because I could not fetch anything, I cannot supply the sources you asked for. Inventing citations for privacy-compliance claims would be worse than useless, so I am declining to produce a list.
- The 'no cookie banner' premise deserves a correction I would rather state than bury: the ePrivacy rule governs storing or reading information on a device, not cookies specifically, and separately the GDPR still governs the processing itself. Cookieless analytics has a very strong argument for consent exemption and several European regulators have accepted specific configurations, but the position is not identical in every member state and I am not a lawyer.
- Google Analytics 4, Mixpanel, Amplitude and PostHog Cloud US are absent on purpose. GA4 fails both the EU-storage and cookieless constraints and has a contested legal history in several EU states; Mixpanel and Amplitude are US-hosted with cookie-based identity by default; PostHog is genuinely self-hostable and has an EU cloud, but its self-hosted footprint is far beyond a $5 VPS and its identity model is cookie-based. If any one of your four constraints is softer than written, that set comes back.
- None of these tools will tell you which marketing channel produced revenue. If that is the actual question behind the analytics purchase, no cookieless tool on this list solves it and you should be looking at server-side attribution in your own database instead.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
