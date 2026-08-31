# What shared support inbox works for two people under $30 a month?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/shared-inbox-two-people-under-30/
>
> A dated record of what one AI assistant answered when asked for a shared support inbox for two agents under $30 a month combined, with custom domain email and canned replies, no punitive per-agent pricing and no annual contract.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:57:04 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need a shared support inbox / lightweight help desk. My hard constraints are: two agents total, under $30/month combined; custom domain email; canned replies; no per-agent pricing that makes a third person expensive; no annual contract. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> Two constraints do most of the work here, and they pull in opposite directions. "Under $30/month combined" for two agents is survivable at most vendors' entry tier; "no per-agent pricing that makes a third person expensive" is not, because per-agent pricing is the help desk business model and the entry tier is precisely where it bites hardest. If you mean the second constraint seriously, the honest ranking puts self-hosted open source at the top and hosted products below it. One more thing worth naming up front: almost none of these products give you the mailbox itself.

**Bottom line:** FreeScout on a small VPS satisfies every constraint you wrote, permanently, for the price of the VPS — and adding your third, fourth and tenth person costs nothing. If you will not run a server, Zoho's free desk tier is the only hosted option I would expect to stay inside $30 while a third agent joins.

**Named, in the order named:**

1. **FreeScout** — It is a free, self-hosted shared inbox with unlimited agents by design, which makes the "third person is expensive" failure mode structurally impossible rather than merely deferred.
   - Pricing, as described: Free and open source (AGPL). Optional one-time paid modules for extras such as workflows or a knowledge base — bought once, not subscribed to. Your recurring cost is a small VPS.
   - Most likely regret: It is a PHP application you now own the uptime of, and support email is the one system where downtime is invisible to you and infuriating to your customer. You will not notice it stopped fetching mail until someone tweets at you.
   - **Model unsure:** FreeScout's module marketplace and licensing details are the part I am least sure of. I am confident the core is free and self-hosted; confirm the module terms yourself.
   - _no source cited_
2. **Zoho Desk (free tier) with Zoho Mail** — Zoho has historically offered a genuinely free desk tier covering a small number of agents including email ticketing and canned responses, plus custom-domain email as a separate cheap product — which is the only hosted combination I can name that plausibly costs nothing at two agents and stays cheap at three.
   - Pricing, as described: Free tier for a limited agent count on Zoho Desk; paid tiers are per agent per month with a monthly billing option. Zoho Mail is separately priced per mailbox and is inexpensive.
   - Most likely regret: You are entering the Zoho ecosystem, and the product is configured rather than used — the admin surface is enormous, the UI is dense, and the free tier's limits are the kind that reveal themselves at the worst moment.
   - **Model unsure:** I am not confident of the current free-tier agent limit or of which features sit inside it, and I will not guess. This is the single claim on this page most worth verifying before you act on it.
   - _no source cited_
3. **Google Workspace collaborative inbox** — Two Business Starter seats give you custom-domain email, and a Google Group configured as a collaborative inbox gives you assignment and resolution on shared messages — with canned replies via Gmail templates — all inside a budget that two seats will fit.
   - Pricing, as described: Per user per month, available on monthly (flexible) billing without an annual commitment. Two seats fits under thirty dollars comfortably at Business Starter pricing; a third seat adds one more seat's cost, linearly and predictably.
   - Most likely regret: A collaborative inbox is not a help desk. There is no conversation history per customer, no real reporting, no SLA view, and the assignment model is weak enough that two people will still occasionally reply to the same customer twice.
   - **Model unsure:** Google Workspace list prices have risen more than once and the flexible-plan surcharge relative to annual has changed. Do not rely on my recollection of the per-seat figure.
   - _no source cited_
4. **Chatwoot** — The self-hosted community edition is free with no agent cap, and unlike most of this list it treats email as one channel among several — so if support later arrives by live chat or WhatsApp you are not migrating.
   - Pricing, as described: Community edition: free, self-hosted. There is a paid cloud offering priced per agent, so the free path here is specifically the one you run yourself.
   - Most likely regret: It is a Rails application with Postgres, Redis and Sidekiq behind it — meaningfully heavier to operate than FreeScout, and email is arguably the channel it treats least lovingly.
   - **Model unsure:** The boundary between Chatwoot's community and paid editions has shifted before; check that the features you need are still on the free side.
   - _no source cited_
5. **Zammad** — Self-hosted and free with unlimited agents, and it is a real ticketing system — proper canned responses, text modules, triggers and audit history — rather than a shared mailbox with labels.
   - Pricing, as described: Open source, free to self-host. There is a separate hosted offering priced per agent.
   - Most likely regret: It is built for IT service desks, and it shows. A two-person SaaS support queue will spend its first week turning off ticket states, priorities and escalation rules it will never use.
   - **Model unsure:** I am confident Zammad exists and is maintained; I cannot confirm current hosted pricing and am not quoting a figure.
   - _no source cited_
6. **Missive** — The best hosted product on this list for two people specifically — it is genuinely designed around a small team sharing an inbox, with internal comments alongside the email thread rather than bolted on.
   - Pricing, as described: Per user per month with monthly billing available, and historically a free tier with limited history. Two users at an entry paid tier has generally landed near, and possibly under, your thirty-dollar ceiling.
   - Most likely regret: It is per-user pricing with no way around it, so the exact scenario you flagged — the third hire — costs you a full extra seat, and Missive's ceiling arrives sooner than a self-hosted one because you also lose the option to simply not pay.
   - **Model unsure:** I am not confident Missive's current per-seat price keeps two users under thirty dollars. I remember it as close to the line, which means I could easily be wrong in the direction that matters.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have read no current pricing page. Every price and every free-tier limit above is recalled, not verified, and free-tier limits are revised more often than headline prices are.
- I cannot give you the documentation and pricing sources you asked for, because I could not fetch any. I would rather state that plainly than manufacture citations that look authoritative.
- Most of these products are a help desk layered over a mailbox you supply elsewhere. Budget separately for the actual mail hosting on your custom domain — that is a real line item people forget when comparing these tools.
- Help Scout, Front, Intercom and Zendesk are deliberately absent. All four are better products than most of what is listed here, and all four are excluded by the same clause: per-agent pricing at a level where two agents alone approach or exceed thirty dollars a month, with the third agent adding another full seat. Help Scout in particular has changed its pricing model at least once in a direction I cannot verify from here, so I am not going to characterise it. If your budget is elastic, that shortlist is where I would look instead.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
