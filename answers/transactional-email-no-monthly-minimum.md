# What transactional email service works for a tiny app without a monthly minimum?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/transactional-email-no-monthly-minimum/
>
> A dated record of what one AI assistant answered when asked for transactional email under 10,000 messages a month with no monthly minimum spend, no mandatory paid plan, deliverability good enough that password resets do not land in spam, and a simple API with no sales call.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 17:12:44 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need transactional email (password resets, receipts) for a low-volume app. My hard constraints are: under 10,000 emails/month; no monthly minimum spend and no mandatory paid plan; deliverability good enough that resets don't land in spam; simple API, no sales call to get started. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> The binding constraint is 'no monthly minimum', and it is stricter than it looks: most of the well-regarded transactional vendors sell plans, not messages, so their floor price is charged whether you send ten emails or ten thousand. That eliminates the deliverability specialists people would normally recommend to you first. What is left is true metered pay-per-message billing, plus a handful of free tiers large enough that 10,000 messages a month never generates an invoice at all. One thing to say before the list: none of this matters as much as your SPF, DKIM and DMARC records.

**Bottom line:** Amazon SES if you can tolerate a plain API and no hand-holding, Resend if you want the developer experience and can live on a free tier that may narrow. Do not self-host outbound SMTP for password resets — the deliverability constraint and the self-hosting instinct are in direct conflict here, and deliverability wins.

**Named, in the order named:**

1. **Amazon SES** — It is genuinely metered per message with no plan and no floor — at your volume the monthly bill is small change — and its shared IP reputation is maintained aggressively enough that correctly-authenticated resets land in the inbox.
   - Pricing, as described: Pay per message sent, priced in fractions of a cent per email, plus a small charge for attachments/data. No monthly minimum, no plan to subscribe to. Historically there has been a free allowance for mail sent from AWS-hosted applications.
   - Most likely regret: You start in the sandbox and must file a support request explaining your use case to send to arbitrary addresses — which is not a sales call, but it is a form, and it can be rejected. After that you get no deliverability guidance, no reputation dashboard worth the name, and no one to ask when a mailbox provider starts deferring you.
   - **Model unsure:** SES per-message rates and the terms of the AWS free allowance have changed over the years. I am confident about the pricing model; do not take a specific per-thousand figure from me.
   - _no source cited_
2. **Resend** — The free tier alone covers a meaningful share of your volume with no card and no plan, the API is the simplest in the category, and it is built on top of established sending infrastructure rather than someone's homemade MTA.
   - Pricing, as described: Free tier of a few thousand emails a month with a daily cap, then paid tiers by monthly volume. No sales contact required for any self-serve tier.
   - Most likely regret: At 10,000 messages a month you are above the free tier, so you will be on a paid plan — and a paid plan with a fixed monthly price is exactly the monthly minimum you said you did not want. It only satisfies your constraint if your real volume is lower than your stated ceiling.
   - **Model unsure:** Resend is a young company and its free tier limits have been adjusted since launch. Verify the current daily and monthly caps rather than trusting my recollection.
   - _no source cited_
3. **Zoho ZeptoMail** — It sells prepaid credits rather than subscriptions — you buy a block of sends, they sit in the account, and there is no recurring charge — which is the most literal possible satisfaction of 'no monthly minimum'.
   - Pricing, as described: Prepaid credit blocks priced per ten thousand emails, purchased when you need them. Transactional-only by policy; they reject marketing sending.
   - Most likely regret: It is a Zoho product, which means the console, the docs and the support experience are built to Zoho's standards rather than to a developer-tools company's, and the transactional-only policy is enforced by a review process that can be slow to approve a new domain.
   - **Model unsure:** I am confident the credit-based model existed and was unusually cheap. I am not confident of the current credit price or whether the expiry terms on credits have changed.
   - _no source cited_
4. **MailerSend** — Its free tier has historically been large enough to cover most of a low-volume app's transactional traffic outright, with a real REST API, templates and webhooks rather than a crippled trial.
   - Pricing, as described: Free tier of several thousand emails a month, then volume-based paid plans. Self-serve throughout.
   - Most likely regret: It is the transactional arm of a company whose main business is bulk email, and shared-pool reputation at a bulk-first provider is a different risk profile than at a transactional-only one. Your resets share IP space with other people's newsletters.
   - **Model unsure:** MailerSend's free tier allowance has been reduced at least once since launch. Check the current number before planning around it.
   - _no source cited_
5. **Brevo** — A permanent free tier with a daily send limit and no card required, an EU-based operation if that matters to you, and transactional sending available through both API and SMTP without ever talking to anyone.
   - Pricing, as described: Free tier capped by emails per day rather than per month, with paid plans above it. Transactional volume has historically been billed separately from marketing contacts.
   - Most likely regret: The daily cap is the trap: password resets are bursty, and a free tier that allows a few hundred a day will silently stop delivering on the one day you need it most — during an incident, a migration, or a launch.
   - **Model unsure:** Brevo is the renamed Sendinblue, and both its free-tier limits and its transactional/marketing plan split have been restructured. My picture of its current shape is unreliable.
   - _no source cited_
6. **Postmark** — The best transactional inbox placement of anything on this list by a wide margin, because it separates transactional and bulk streams onto different infrastructure — if the constraint you actually care most about is 'resets do not land in spam', this is the answer.
   - Pricing, as described: Monthly plans by message volume, with a small permanently free developer allowance for testing. The paid plans are a fixed monthly charge, i.e. a monthly minimum.
   - Most likely regret: It fails the constraint you actually wrote. The entry plan is a fixed monthly fee whether you send one message or its full allowance, and Postmark has historically been one of the more expensive options per message at low volume.
   - **Model unsure:** Postmark was acquired by ActiveCampaign, and I cannot confirm from here whether its pricing, free developer tier or transactional-only discipline have survived that unchanged. That uncertainty is the reason it is ranked below cheaper products it beats on quality.
   - _no source cited_
7. **Postal / self-hosted SMTP** — It is here for completeness, because self-hosting is a genuinely correct answer in most categories and I want to be explicit that I do not think it is one here.
   - Pricing, as described: Free and open source. Your cost is a VPS, plus reverse DNS, plus a clean IP, plus your own time.
   - Most likely regret: A fresh IP has no sending reputation, most cheap VPS providers block port 25 outright, and the major mailbox providers will treat a low-volume unknown sender with suspicion for months. You would be trading a few dollars a month for the risk that your customers cannot reset their passwords — which is the one email that must never fail.
   - **Model unsure:** Postal exists and works well as an MTA. My negative recommendation is about IP reputation economics, not about the software.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have not read a single current pricing page. Free-tier allowances in transactional email are revised more often than almost anything else in SaaS, and every free-tier size mentioned above should be treated as possibly stale.
- Because I could not fetch anything, I cannot give you the source list you asked for. I would rather tell you that than invent documentation URLs that look right.
- SendGrid, Mailgun and Mailchimp Transactional (Mandrill) are deliberately absent. SendGrid's long-standing free tier has been reported as withdrawn or restructured and I cannot verify its current state, Mailgun retired the pay-as-you-go flex option that would have made it a strong fit here, and Mandrill requires an active paid Mailchimp account plus prepaid blocks, which is a mandatory paid plan by any reading of your constraint. If any of those have changed back, they are all credible choices.
- Ranking on deliverability from memory is the weakest thing I am doing here. Inbox placement is measured, it varies by mailbox provider and by month, and my ordering reflects each vendor's reputation and architecture rather than current data I have seen.
- The largest single factor in whether your password resets land is not on this list: it is a correct SPF record, a DKIM signature on your own domain, a DMARC policy, and never mixing marketing sends into the same domain or IP pool as your resets. Get that right and most of these vendors will perform acceptably; get it wrong and none of them will save you.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
