# What in-app changelog widget doesn't use per-seat pricing?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/changelog-embeddable-no-per-seat/
>
> A dated record of what one AI assistant answered when asked for a product changelog with an embeddable in-app widget, no per-seat pricing, a widget available on the free or cheapest tier, a search-indexable public page, and self-hosting acceptable.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 17:09:33 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need a product changelog with an embeddable in-app widget. My hard constraints are: no per-seat pricing; embeddable widget on the free or cheapest tier; public changelog page indexable by search engines; self-hosted acceptable. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> Two of your constraints quietly conflict with how this category is built. Vendors put the embeddable widget behind the paid tier because the widget is the product, and they host your public changelog on their subdomain because that is their SEO, not yours — which means the "indexable by search engines" constraint is usually satisfied for them rather than for you. Given that, and given that a changelog is a list of dated HTML entries, I am going to rank building it yourself first and mean it.

**Bottom line:** A changelog is a static page plus an RSS feed plus about fifty lines of JavaScript, and building it yourself is the only option here that puts the indexable page on your own domain where the SEO value accrues to you. Buy a vendor only if you want the read-state tracking and the notification analytics, and know that is what you are buying.

**Named, in the order named:**

1. **Your own static page plus an RSS feed** — It is the only approach that satisfies every constraint absolutely: no seats to price, the public page lives on your own domain under your own path so the search value accrues to you, and the in-app widget is a small script that fetches your feed and renders the last few entries with a seen-marker in localStorage.
   - Pricing, as described: Free. Markdown files in your existing repository, rendered by whatever static generator you already run, deployed with the rest of your site.
   - Most likely regret: Nobody schedules the maintenance for something they built in an afternoon. The widget is fine until you want per-user read state, segmented announcements or a click-through metric, and then you are building a small product instead of shipping your actual one.
   - _no source cited_
2. **Headway** — Purpose-built for exactly this — a hosted changelog with a badge-and-panel embeddable widget — and priced per project rather than per team member, so a 3-person company pays the same as a 30-person one.
   - Pricing, as described: Historically a free tier with the widget included plus paid tiers for custom domain and branding removal. Per project, not per seat.
   - Most likely regret: On the free tier your public changelog lives on the vendor's subdomain, which means the indexable page you are building up is theirs, not yours. Getting it onto your own domain is precisely the thing you have to pay for.
   - **Model unsure:** I am not confident Headway is still actively operated or that its pricing is anything like what I remember. This category has a high mortality rate among small vendors and Headway is one I would check exists before planning around it.
   - _no source cited_
3. **Beamer** — Priced by audience size — monthly active users who see the widget — rather than by how many people on your team publish, which is exactly the pricing axis your constraint asks for.
   - Pricing, as described: Tiered by monthly active users reached, with a limited free tier. No per-seat component on the lower tiers.
   - Most likely regret: Audience-based pricing scales with your success rather than with your usage of the tool, so the bill grows precisely when you can least be bothered to migrate — and migrating a changelog means breaking every indexed URL you accumulated.
   - **Model unsure:** Beamer's tier names, MAU thresholds and free-tier feature set have changed and I will not quote figures. Verify whether the widget is still on the free tier at all, because that is the constraint most likely to have moved.
   - _no source cited_
4. **AnnounceKit** — Widget-first product with a public, crawlable changelog page and a custom-domain option, priced by plan rather than by team seat.
   - Pricing, as described: Plan-based tiers. I recall a free or very cheap entry tier including the widget, with custom domain further up.
   - Most likely regret: Small vendor with a small ecosystem — you are betting your announcement channel on a company whose continued existence you cannot really assess, and the widget is embedded in your production app.
   - **Model unsure:** I am not confident of AnnounceKit's current pricing, and I am only moderately confident about the shape of its free tier. Treat this entry as a name to go and check rather than a recommendation with numbers attached.
   - _no source cited_
5. **Ghost** — If you self-host it the cost is a VPS with no seat licensing at all, and it gives you a genuinely well-built, fast, server-rendered public page on your own domain with an RSS feed you can point a twenty-line widget at.
   - Pricing, as described: Open source (MIT), free to self-host. Ghost Pro is the paid hosted version, priced by audience size rather than by team seats.
   - Most likely regret: It is a publishing platform, not a changelog tool. There is no in-app widget, no read-state tracking and no per-user targeting — you get a good page and a feed, and everything in-app is still your code.
   - **Model unsure:** I am confident Ghost exists and is healthy. I am not confident of current Ghost Pro tier pricing and am not quoting it.
   - _no source cited_
6. **Frill** — Bundles the changelog with a public roadmap and idea board on plan-based rather than seat-based pricing, which is worth something if you were going to buy a feedback tool anyway.
   - Pricing, as described: Plan-based monthly tiers rather than per-seat. I believe the widget sits on the paid tiers rather than a free one.
   - Most likely regret: You are adopting a three-product suite to get one of them, and if you later leave you are migrating a roadmap and a voting history as well as a changelog.
   - **Model unsure:** I am genuinely unsure whether Frill still operates under that name and ownership, and equally unsure about its current tiers. Verify it exists before evaluating it.
   - _no source cited_
7. **Keep a Changelog in your repository, rendered on your docs site** — If your users are developers, a CHANGELOG.md maintained under the Keep a Changelog convention and rendered into your existing documentation site is free, indexable, versioned alongside the code, and completely portable.
   - Pricing, as described: Free. It is a text file.
   - Most likely regret: There is no in-app surface at all, so the people who most need to know a feature shipped — the ones already inside your product — never see it. This satisfies the SEO constraint and ignores the widget one.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have not read a current pricing page for any of these. Everything above is from memory, and for a category of small independent vendors that memory is unusually likely to be stale — or to describe a company that has since shut down or been acquired.
- I cannot provide the documentation and pricing sources you asked for, since I could not fetch anything. I would rather say so than fabricate citations.
- The constraint most likely to be violated in practice is "embeddable widget on the free or cheapest tier". In this category the widget is the thing being sold, so vendors move it up a tier more readily than they change headline prices. Check that specific line before anything else.
- Canny, Productboard and LaunchNotes are absent by design. Canny and Productboard price around team members or tracked users in ways that collide directly with your no-per-seat constraint, and LaunchNotes is positioned and priced for companies considerably larger than three people. They are capable products; they are simply not the products your constraints describe.
- One structural point that applies to every hosted option here: if the public changelog is served from the vendor's domain, the search-engine indexability you are paying for benefits their domain, not yours. Only a custom domain, or building it yourself, actually satisfies that constraint in the way you probably meant it.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
