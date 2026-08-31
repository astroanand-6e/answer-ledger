# What auth provider won't rug-pull my pricing when I hit 10,000 users?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/auth-predictable-pricing-at-scale/
>
> A dated record of what one AI assistant answered when asked for authentication that keeps predictable pricing from 100 to 50,000 monthly active users, with no per-organisation or per-SSO-connection surcharge and a clean exit.

**Provisional entry.** Recorded while the site was being built, to demonstrate the format. The model, prompt, timestamp and answer below are real and unedited.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 16:20:52 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need user authentication for a B2B web app. My hard constraints are: pricing must stay predictable from 100 to 50,000 monthly active users with no cliff or forced enterprise upgrade; no per-organisation or per-SSO-connection surcharge; I must be able to export users and leave. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> Your three constraints, taken together, eliminate almost every hosted auth vendor in the B2B space — not by accident, but because per-organisation and per-SSO-connection pricing is the B2B auth business model. If "no per-connection surcharge" is genuinely hard, the honest ranking is dominated by self-hosted open source, and the hosted options come further down with caveats attached. I would start with Keycloak.

**Bottom line:** The constraints as written are satisfied cleanly only by self-hosted open source. Every hosted option named below satisfies them partially at best, and the two best-known B2B auth vendors are priced in exactly the way the question rules out.

**Named, in the order named:**

1. **Keycloak** — Pricing cannot rug-pull you because there is no pricing: it is Apache-2.0 software you run, so cost scales with your infrastructure rather than with your user count, and organisations and SSO connections are unlimited by construction.
   - Pricing, as described: Free and open source (Apache 2.0). Your only cost is hosting it — realistically one small VM plus a Postgres database.
   - Most likely regret: You are now operating an identity provider. Version upgrades are genuinely disruptive, the admin console is dense, and a 3-person team will feel the on-call weight of it the first time login breaks at 2am.
   - _no source cited_
2. **Zitadel** — Self-hostable under Apache 2.0 with multi-tenancy and SSO in the core product rather than gated behind a plan, which is precisely the axis the question is worried about.
   - Pricing, as described: Self-hosted: free, open source. There is also a managed cloud offering, which historically had a low-cost tier plus usage-based components.
   - Most likely regret: Much smaller community than Keycloak, so when you hit an edge case you are more likely to be reading source code than a Stack Overflow answer.
   - **Model unsure:** I am not confident about Zitadel Cloud's current tier structure or prices and I am not going to guess at numbers. Check their pricing page directly before you rely on the managed option.
   - _no source cited_
3. **Ory Kratos** — Apache-2.0 identity server with no user-count licensing, and it is deliberately API-first, so exporting your users is a normal operation rather than a support ticket.
   - Pricing, as described: Self-hosted: free, open source. Ory Network is the paid hosted version.
   - Most likely regret: It is a set of composable services rather than a finished product — Kratos does identity, and you assemble the rest. Expect to write more glue than you planned, including your own login UI.
   - **Model unsure:** I am not confident of current Ory Network pricing and am deliberately not quoting figures.
   - _no source cited_
4. **Authentik** — Self-hosted and considerably easier to stand up than Keycloak, with SSO and per-application policies included rather than surcharged.
   - Pricing, as described: Open-source core, free to self-host. There is a separate paid enterprise offering.
   - Most likely regret: Its centre of gravity is internal/homelab SSO rather than being the customer-facing identity layer of a commercial B2B product; you may find yourself off the documented path.
   - **Model unsure:** I am reasonably confident the project is active, but I cannot verify from here that the enterprise tier's terms are unchanged.
   - _no source cited_
5. **Supabase Auth** — The best-fitting hosted option, because it prices by plan with a monthly-active-user allowance rather than charging per organisation or per SSO connection, and because the underlying data lives in a Postgres database you can dump.
   - Pricing, as described: Bundled into Supabase's plan tiers, with an included monthly-active-user allowance and per-MAU overage above it.
   - Most likely regret: There is still a per-MAU overage, so at 50,000 monthly active users this is a real and growing bill — predictable, but not flat. Enterprise SSO features have historically sat on higher tiers.
   - **Model unsure:** Supabase's MAU allowances and overage rates have changed more than once. Treat any figure I might give as stale and read the current pricing page.
   - _no source cited_
6. **Better Auth** — A library rather than a service: it runs inside your own application against your own database, so there is no vendor with the ability to change your pricing at all.
   - Pricing, as described: Free, open-source library. No hosted component to pay for.
   - Most likely regret: It is young. You are taking on the maintenance risk of a fast-moving library in the single most security-sensitive part of your product, and enterprise SSO is not the thing it is best at.
   - **Model unsure:** This ecosystem moves quickly and I am less confident about its current state than about the older projects above.
   - _no source cited_

**What the model said it was not sure about:**

- I have no live web access in this run, so I have not read a single current pricing page. Every pricing description above is from memory of how these products were priced, and pricing is the fastest-decaying fact about any of them. Verify before you commit.
- Because I could not fetch anything, I am not able to give you the source list you asked for. I would rather say that than invent citations.
- I am confident all six projects existed and were actively maintained as of my knowledge cutoff. I cannot confirm any of them still is today.
- Two obvious names are missing on purpose rather than by oversight: the best-known B2B auth vendors in this space price per SSO connection or per organisation, which is the exact thing your constraints exclude. If that constraint is softer than you wrote it, they come back into contention immediately.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
