# What newsletter tool stays cheap under 1,000 subscribers?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/email-marketing-under-1000-subscribers/
>
> A dated record of what one AI assistant answered when asked for newsletter and email marketing tooling that stays free or under $15 a month at fewer than 1,000 subscribers, without per-contact price creep and with an export you control.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:53:07 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need email marketing / newsletter sending for a small audience. My hard constraints are: under 1,000 subscribers; genuinely free or under $15/month at that size; no per-contact price creep as the list grows slowly; I can export my list at any time. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> Two of your constraints are in tension and you should know which one you are actually buying. "Under $15 at 1,000 subscribers" is easy — most of the market has a free tier at that size, because they are all fishing for you. "No per-contact price creep as the list grows" is the hard one, and it eliminates the entire mainstream category, because pricing per contact is the business model of email marketing rather than an unfortunate detail of it. Only one architecture actually escapes it: pay for emails sent rather than for contacts stored. I would start with Listmonk.

**Bottom line:** If the price-creep constraint is real, self-host Listmonk in front of Amazon SES and your bill is a function of how much mail you send, not how many people you have — which is the only pricing model that does not eventually punish you for succeeding. If you do not want to run a mail stack, EmailOctopus and Buttondown are the two hosted options least likely to make you angry at 5,000 subscribers.

**Named, in the order named:**

1. **Listmonk** — It is the only option here where subscriber count is not a billable dimension at all: a single Go binary and a Postgres database that hands your mail to Amazon SES or Postmark, so 900 subscribers and 90,000 subscribers cost the same to store.
   - Pricing, as described: Free and open source (AGPL). You pay only for a small server and for outbound delivery — SES in particular is priced per thousand emails at a level where a small newsletter costs cents, not dollars.
   - Most likely regret: You are now responsible for email deliverability, which is a genuinely miserable specialty. SPF, DKIM, DMARC, warming a sending domain, bounce and complaint handling, and getting out of an SES sandbox are all now your problem, and when Gmail starts spam-foldering you there is no support queue to escalate to.
   - **Model unsure:** I am confident the project exists and is actively maintained, and confident about its licence. I am not going to quote current SES per-thousand rates from memory.
   - _no source cited_
2. **EmailOctopus** — The best-behaved hosted option on the price-creep axis: it has historically offered a free tier comfortably above your 1,000 subscribers, and its paid tiers climb far more gently than the mainstream vendors because it is built to sit on cheap infrastructure.
   - Pricing, as described: Free tier covering a few thousand subscribers with a monthly send cap and their branding on the footer; paid plans priced by subscriber band above that. Historically they also allowed bringing your own Amazon SES account on a cheaper plan.
   - Most likely regret: It is a deliberately lightweight product. If you later want serious behavioural automation, conditional sequences or real segmentation, you will be rebuilding your entire list somewhere else at exactly the moment you are busiest.
   - **Model unsure:** The bring-your-own-SES plan is the specific thing I am least sure still exists — I believe it was de-emphasised at some point. Verify before you architect around it.
   - _no source cited_
3. **Buttondown** — A small independent product with an explicit, human pricing page and a one-click full export, run by someone who has been publicly consistent about not holding lists hostage — which is the constraint you should actually worry about, not the first month's price.
   - Pricing, as described: Free tier for a small list (on the order of a hundred subscribers), then modest monthly tiers by subscriber count. Well under your ceiling at 1,000.
   - Most likely regret: It is a one-person-scale business. That is exactly why it is pleasant, and also exactly why you should keep your own copy of the list — there is no enterprise behind it if the maintainer's circumstances change.
   - **Model unsure:** Buttondown's free-tier subscriber limit is a number I would get wrong if I guessed, and I think it has moved. Read the pricing page.
   - _no source cited_
4. **MailerLite** — The most capable free tier in the mainstream tier of the market at your size — real automations, landing pages and forms included rather than paywalled — so at 1,000 subscribers you are very likely paying nothing while getting a full product.
   - Pricing, as described: Free plan up to a subscriber threshold in the low thousands with a monthly email send cap; paid plans priced in subscriber bands above it.
   - Most likely regret: This is per-contact pricing with a generous first step. It satisfies your budget today and violates the spirit of your second constraint tomorrow: the bill rises with the list whether or not you send more mail. Also, their account approval process has historically rejected or suspended accounts it considered risky, and being told your list is frozen is a bad Tuesday.
   - **Model unsure:** MailerLite's free-tier limits have been revised more than once and I do not trust my memory of the current numbers.
   - _no source cited_
5. **Kit (formerly ConvertKit)** — Free at your size with a free tier that has historically been unusually generous — into five figures of subscribers — and the export is straightforward, so it is a low-risk place to start even though it is not a low-cost place to end.
   - Pricing, as described: Free plan up to a high subscriber threshold with limited features, then subscriber-band pricing that climbs steeply.
   - Most likely regret: The paid ramp is the steepest on this list. Kit is priced for creators who monetise their list directly; a bootstrapped SaaS sending a monthly product update gets the same bill without the same revenue attached to it.
   - **Model unsure:** ConvertKit rebranded to Kit and restructured its free plan around the same period. I am confident the rebrand happened; I am not confident about the current free-tier ceiling or feature limits.
   - _no source cited_
6. **beehiiv** — A free tier that covers well past 1,000 subscribers, with the publication, web archive and subscribe page included, so it replaces a newsletter tool and a hosted blog at once.
   - Pricing, as described: Free plan up to a few thousand subscribers; paid plans by subscriber band, and the paid steps are not small.
   - Most likely regret: It is built for media businesses chasing ad and referral revenue, and the product pushes you in that direction. For a SaaS product update list you will be paying — in attention if not in money — for a monetisation apparatus you will never use.
   - **Model unsure:** beehiiv's free-tier subscriber ceiling has changed since launch. Do not rely on my recollection of the number.
   - _no source cited_
7. **Brevo (formerly Sendinblue)** — The one mainstream hosted vendor that prices by emails sent rather than by contacts stored, which is structurally the thing your no-price-creep constraint is asking for — you can hold 50,000 contacts and pay for the mail you actually send.
   - Pricing, as described: Free tier with a daily send limit and unlimited stored contacts; paid plans priced by monthly email volume.
   - Most likely regret: The daily send cap on the free tier is the catch: a single blast to 1,000 people may need to be scheduled around it, and the product is a sprawling CRM-and-marketing suite where the newsletter is one tab among many. It is the least pleasant thing here to use.
   - **Model unsure:** The company renamed from Sendinblue to Brevo and reorganised its plans around the same time. I am confident about the rename and about the send-volume pricing model, not about the current limits.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have not read a single current pricing page. Free-tier thresholds are the single most volatile number in this entire market — every vendor here has moved theirs at least once — so treat every limit above as a direction, not a figure.
- Because I could not fetch anything, I cannot supply the sources you asked for. I would rather say so plainly than invent citations to pricing pages I have not read.
- On your export constraint: every hosted product above offers a CSV export, but an export is only worth something if you take it. Set a calendar reminder to pull your list monthly and keep it in your own storage. The failure mode is never that export is missing — it is that your account got suspended before you used it.
- Mailchimp is absent deliberately. It is the archetype of the exact thing you excluded: contact-count pricing that ratchets, a free tier that was cut back sharply, and unsubscribed and archived contacts that have historically still counted toward your billable total. HubSpot and ActiveCampaign are absent for the same reason at a higher price point.
- Substack is also absent on purpose. It is free and the export is genuinely clean, but it is a publishing platform with its own network and recommendation surface, not a tool for sending product email from your own domain, and I read your question as the latter.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
