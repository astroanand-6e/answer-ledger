# What self-hosted Calendly alternative actually works?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/self-hosted-scheduling-calendly-alternative/
>
> A dated record of what one AI assistant answered when asked for a self-hostable meeting-scheduling tool that runs on your own domain, syncs with Google and Microsoft calendars, and is not priced per user.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:41:18 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need meeting scheduling links (a Calendly alternative). My hard constraints are: self-hostable on my own domain; Google and Microsoft calendar sync; no per-user pricing; team round-robin not required. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> "Self-hostable" removes the entire commercial scheduling category in one stroke — Calendly, SavvyCal, Microsoft Bookings and Zoho Bookings are hosted-only, and most of them are also priced exactly the way you said you will not pay. What is left is a genuinely small field: one serious open-source product, one calendar suite that grew a booking feature, and a handful of PHP and WordPress options that are older and less fashionable but that do the job. Dropping the round-robin requirement helps you more than you probably realise, because team scheduling is the feature every vendor puts behind the paid seat. I would start with Cal.com.

**Bottom line:** Cal.com self-hosted is the only option that matches your constraints without compromise, and the compromise it demands in return is that you now run a moderately complex Next.js application that talks to two OAuth providers. If that sounds worse than paying, the honest second answer is a WordPress booking plugin on the site you already run.

**Named, in the order named:**

1. **Cal.com (self-hosted)** — It is the one open-source project built specifically to be a Calendly replacement rather than a booking system adapted into one, and Google Calendar and Microsoft 365 / Outlook are both first-class sync integrations rather than community add-ons.
   - Pricing, as described: Self-hosted community edition is free under AGPLv3. There is a separate paid cloud product and a separately licensed enterprise edition; the self-hosted community build is the free one.
   - Most likely regret: The self-hosted path is meaningfully harder than the README implies. You are deploying a large Next.js monorepo with a Postgres database, and you must register and maintain your own Google and Microsoft OAuth applications — including Google's verification process if you ever expose it beyond your own team. Upgrades are not a one-line pull.
   - **Model unsure:** Cal.com has moved some features between the community AGPL build and the commercially licensed enterprise build more than once. I am not confident which side of that line every feature sits on today. Check the current licence and feature matrix before you assume a specific capability is in the free build.
   - _no source cited_
   - **Editor's note (checked 2026-08-31) — not part of the answer:** Cal.com stopped being open source in April 2026: the production codebase moved to a private repository, and the public repository was renamed to calcom/cal.diy and relicensed from AGPL 3.0 to MIT with the enterprise features removed. The self-hostable product named here now exists under the name Cal.diy. Anyone acting on this recommendation in order to self-host should follow the Cal.diy repository rather than cal.com, which is now the hosted commercial product.
     - Evidence: [Going Closed-Source: Technical Changes Behind Cal.diy](https://cal.com/blog/cal-diy-open-source-to-closed-source) (cal.com)
     - Evidence: [calcom/cal.diy — scheduling infrastructure for absolutely everyone (MIT)](https://github.com/calcom/cal.diy) (github.com)
2. **Nextcloud Calendar (Appointments)** — If you already run Nextcloud, booking pages are a built-in feature of the calendar app rather than another service to operate, and it costs nothing extra per person because Nextcloud is not priced per user when you self-host.
   - Pricing, as described: Free and open source (AGPL) when self-hosted. Nextcloud sells a paid enterprise subscription for support, which you do not need for three people.
   - Most likely regret: The Google and Microsoft story is indirect. Nextcloud speaks CalDAV natively; syncing a Google or Outlook calendar into it is a separate configuration step, and two-way freshness is not as reliable as a native OAuth integration. If your availability is really lived in Outlook, you will spend evenings debugging why a booking landed on top of an existing meeting.
   - **Model unsure:** The booking/appointments feature has been reworked across Nextcloud releases. I am confident it exists; I am not confident about the exact capabilities of the version you would install today.
   - _no source cited_
3. **Easy!Appointments** — A plain PHP and MySQL application that drops onto ordinary shared hosting or a small VPS, with no licence key, no user tiers and no account with anybody — which makes it the lowest-operational-risk self-host on this list.
   - Pricing, as described: Free and open source (GPLv3). Your cost is whatever the hosting costs, which for this can be almost nothing.
   - Most likely regret: It is built around the service-provider-and-customer booking model — think a clinic or a salon — not around a founder sending a link before a sales call. The default UI will look like a booking system to your prospects, and Microsoft calendar sync is the weak spot.
   - **Model unsure:** I recall solid Google Calendar sync. I am genuinely unsure whether first-class Microsoft 365 / Outlook sync exists in the current version, and that is one of your hard constraints, so verify it before anything else.
   - _no source cited_
4. **Amelia (WordPress plugin)** — If you already run WordPress on your domain, this is self-hosting with none of the new infrastructure: it is licensed per site rather than per user, so all three of you are covered by one licence, and both Google and Outlook sync are supported features.
   - Pricing, as described: Commercial plugin sold as an annual per-site licence, with a lifetime option. Not free, but it is a site licence, not a seat licence — which is the constraint you actually care about.
   - Most likely regret: You are now depending on a commercial WordPress plugin for a customer-facing workflow. If you stop renewing you stop getting updates, and a plugin that handles OAuth tokens is not one you want running unpatched. It also drags scheduling into your marketing site's uptime and update cycle.
   - **Model unsure:** Amelia's tier names and prices have changed and I will not quote a figure. Check whether Outlook sync is in the tier you are looking at rather than only in a higher one.
   - _no source cited_
5. **FluentBooking (WordPress plugin)** — Same site-licensed, no-per-user model as Amelia, but built much more deliberately as a Calendly-style scheduling-link tool rather than as an appointment system, so the booking page reads the way you want it to.
   - Pricing, as described: Commercial WordPress plugin with a free version in the plugin directory and paid annual per-site licences.
   - Most likely regret: It is the youngest thing on this list by some distance. A newer plugin means fewer eyes on the OAuth and webhook code, and a smaller pool of people who have already hit the bug you are about to hit.
   - **Model unsure:** I am moderately but not fully confident about this product's current state and licence tiers. Treat everything above as a lead to verify rather than a fact.
   - _no source cited_
6. **TidyCal** — Listed last and honestly: it is the cheapest way to satisfy every constraint except the one you called hard, because it is a flat one-time or low-cost account rather than a per-seat subscription, with Google and Microsoft calendar connections.
   - Pricing, as described: Historically sold as a low one-time lifetime purchase, later also as a subscription. Not per-user in the way Calendly is.
   - Most likely regret: It is not self-hosted, so it fails your first constraint outright. You would be trading your stated requirement for a much easier life, and if the vendor changes hands or sunsets the lifetime deal, you have no code to fall back on.
   - **Model unsure:** I am not confident that the lifetime pricing model still exists or is still offered to new customers. Do not plan around it without checking.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have read no current pricing page, no licence file and no feature matrix. Every pricing and feature description above is recalled from memory, and for the WordPress plugins in particular that memory is the least reliable part of this answer.
- Because I could not fetch anything, I cannot give you the source list you asked for. I would rather tell you that than manufacture plausible-looking documentation links.
- Calendar sync is the specific claim I would double-check first for every option here. Google Calendar support is common; genuine two-way Microsoft 365 / Outlook support is much rarer in self-hosted tools, and several projects list it while implementing only a subset of it.
- Calendly, SavvyCal, Microsoft Bookings, Zoho Bookings, HubSpot Meetings and Google Appointment Schedules are all absent on purpose, not by oversight. None of them can be self-hosted on your domain, and most are priced per seat. If the self-hosting requirement is softer than you wrote it, Calendly and SavvyCal immediately become better products than anything on this list.
- Dropping round-robin is what makes this list possible. If you add team round-robin back as a requirement, the self-hosted field narrows to roughly Cal.com alone.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
