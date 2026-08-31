# What session replay tool is GDPR-safe and EU-hosted?

> Canonical page: https://astroanand-6e.github.io/answer-ledger/answers/session-replay-eu-hosting-no-cookies/
>
> A dated record of what one AI assistant answered when asked for session replay with EU data residency, no third-party cookies, automatic PII masking on by default, a self-hostable option, and a ceiling of $50 a month at low traffic.

## Run: Claude Opus 5 (Anthropic)

| field | value |
| --- | --- |
| Model | `claude-opus-5[1m]` |
| Answered | 2026-08-31 17:09:41 UTC |
| Retrieval | no — answered from training data, cited nothing |

**Verbatim prompt:**

```text
I run a 3-person bootstrapped SaaS company. I need session replay to debug UI problems. My hard constraints are: EU data residency; no third-party cookies; automatic PII masking on by default; self-hostable option preferred; under $50/month at low traffic. Recommend at least five specific, named products or open-source projects, ranked best-fit first, and include self-hosted or free-tier options where they genuinely fit rather than defaulting to paid SaaS. For each one give: the current pricing model, the single strongest reason it satisfies my constraints, and the one thing most likely to make me regret choosing it. Then list the documentation, pricing pages, or other sources you are relying on for each claim. If you are not confident that a product still exists, or that its pricing is current, say so explicitly rather than guessing.
```

**Answer, verbatim opening:**

> EU residency plus masking-on-by-default eliminates most of this market before you look at price, because the large session-replay vendors are US-hosted and mask by opt-in, which is the wrong default for you and legally the wrong default generally. It also eliminates the free tool everyone will tell you to use. What survives is a short list: two open-source products with real EU hosting and privacy-first defaults, one error tracker that added replay with masking on by default, and the option of assembling it yourself. Start with PostHog on its EU cloud, or OpenReplay if you genuinely want the data on your own disks.

**Bottom line:** PostHog's EU cloud is the pragmatic answer — masking of inputs is the default, the free tier covers low traffic, and it can be configured to persist nothing in a cookie. OpenReplay is the answer if "self-hostable" is a hard requirement rather than a preference, and you should know before you start that you are volunteering to run a fairly large data stack for three people.

**Named, in the order named:**

1. **PostHog (EU Cloud)** — It offers an explicitly separate EU-hosted cloud region with data kept in the EU, its replay recorder masks input fields by default rather than on request, and its client library can be configured to store nothing in cookies at all — so all three privacy constraints are met without you writing any code.
   - Pricing, as described: Usage-based with a monthly free allowance of session recordings; at genuinely low traffic a 3-person SaaS typically stays inside the free allowance and pays nothing.
   - Most likely regret: It is an analytics platform that happens to do replay, so the recorder is a large script and the product surface around it is enormous. The specific failure mode is billing: usage-based pricing on recordings is fine until one bot or one viral day turns a free month into a surprise, so set a billing limit on day one.
   - **Model unsure:** I am confident the EU region and the free recording allowance existed as of my knowledge cutoff. I am not confident of the current allowance size or the per-recording rate above it, and I will not invent numbers for either. Also verify the cookieless configuration yourself — the default persistence mode does use a cookie, and turning it off is a configuration choice, not the out-of-the-box behaviour.
   - _no source cited_
2. **OpenReplay** — The strongest fit for the self-hosting constraint: it is open source and designed to be run on your own infrastructure, which makes EU residency a property of where you deploy it rather than a vendor promise, and it ships sanitisation features for obscuring text and inputs before anything leaves the browser.
   - Pricing, as described: Free and open source to self-host; there is also a paid managed cloud offering. Self-hosted, your cost is the servers and storage, which for session replay is mostly object storage and it is not nothing.
   - Most likely regret: You are now operating a session-replay backend. The self-hosted stack is multi-service — a database, a queue, object storage, an ingestion pipeline — and replay data is bulky, so the thing you will actually regret is the storage bill and the retention policy you forgot to set, not the install.
   - **Model unsure:** OpenReplay's licence has not always been a plain OSI open-source licence and I am not certain what it is today. If the licence terms matter to you commercially, read them before you deploy rather than after.
   - _no source cited_
3. **Sentry Session Replay** — Privacy is the default rather than a setting: the replay integration masks all text and blocks all media unless you explicitly unmask it, which is exactly the posture your constraint asks for, and Sentry offers an EU data region as well as a fully self-hostable distribution.
   - Pricing, as described: Plan-based with usage quotas — a low-cost team plan plus a replay quota, with overage above it. The entry paid tier sat comfortably under your $50 ceiling as I remember it.
   - Most likely regret: Replay here exists to give context to an error, not to let you browse user sessions looking for UI friction. If your actual need is "watch how people use the new onboarding", you will find the discovery experience frustrating compared with a dedicated replay product.
   - **Model unsure:** I am reasonably confident about the masking defaults and the existence of an EU region. I am less confident about the current replay quota and overage rate, and self-hosted Sentry is a heavy install that the company has explicitly declined to support at scale.
   - _no source cited_
4. **Matomo (On-Premise) with Session Recording** — The most privacy-conservative option on this list by design and reputation: self-hosted on your own EU servers, configurable to run without cookies entirely, and built by a company whose entire positioning is GDPR compliance rather than growth analytics.
   - Pricing, as described: The core On-Premise product is free and open source (GPL). Session recording and heatmaps are, as I recall, a paid premium plugin bought separately rather than part of the free core.
   - Most likely regret: The replay experience is the weakest of anything here. It is a privacy-first web analytics product with recording bolted on, and if you are debugging a subtle React rendering bug you will wish you had one of the developer-focused tools instead.
   - **Model unsure:** I am not confident whether the session recording plugin is still sold as a one-off licence, an annual subscription, or bundled differently, and the price may well exceed a $50/month equivalent. Check the plugin marketplace directly.
   - _no source cited_
5. **Highlight.io** — Open source and self-hostable with session replay and error monitoring in one product, and privacy controls including default obfuscation of input fields.
   - Pricing, as described: Open-source self-hosted plus a paid cloud with a free tier, as I remember it.
   - Most likely regret: The maintenance and ownership question, not the product. My recollection is that this project was acquired, and acquired open-source developer tools have a poor record of remaining independently viable — which is a bad property in something you are about to embed in your frontend.
   - **Model unsure:** I have real doubt about this one. I am not confident it still exists as an independent product, under this name, or with a usable free tier. I am including it because it genuinely fit the constraints when I last knew about it, but verify that it is still alive before you evaluate it further.
   - _no source cited_
   - **Editor's note (checked 2026-08-31) — not part of the answer:** Highlight.io was acquired by LaunchDarkly, announced in March 2025 and completed in April 2025. Session replay is now part of the LaunchDarkly platform, offered through an Early Access programme, rather than a standalone product with its own free tier and pricing page. The independent product this entry describes no longer exists in that form.
     - Evidence: [Welcome Highlight to LaunchDarkly: building the future of Guarded Releases together](https://launchdarkly.com/blog/welcome-highlight-to-launchdarkly/) (launchdarkly.com)
6. **rrweb** — The open-source recording library that most of the products above are built on. Recording to your own EU object storage with your own masking rules is the only option here where no third party is involved at any point, and it has first-class support for masking by CSS selector and for blocking elements entirely.
   - Pricing, as described: Free and open source (MIT). You pay for storage and for your own time.
   - Most likely regret: rrweb records and replays; it does not index, search, link to errors, or expire old sessions. You will build a mediocre version of OpenReplay over six months and then wish you had just run OpenReplay. Only take this path if your masking requirements are genuinely unusual.
   - _no source cited_

**What the model said it was not sure about:**

- I had no live web access in this run, so I have not read a single current pricing page, data-processing agreement or sub-processor list. Everything above is from memory, and for a GDPR question the sub-processor list is exactly the document that matters and exactly the one I could not check.
- Because I could not fetch anything, I cannot supply the documentation and pricing sources you asked for, and I would rather tell you that than fabricate links to privacy policies — which in this category would be actively dangerous.
- Nothing on this list makes you GDPR-compliant. Session replay records user behaviour and, unless masking is watertight, user data; you still need a lawful basis, a mention in your privacy notice, and in most readings a data-processing agreement with whichever vendor you pick. "EU-hosted" is one input to that, not the answer to it.
- Two obvious names are absent because your constraints exclude them rather than because they are poor products: Microsoft Clarity is free and excellent but is US-operated with no EU residency guarantee I would rely on, and FullStory, Hotjar and LogRocket are US-hosted, mask by configuration rather than by default, or price well above $50 a month once replay volume is real.
- I am confident PostHog, Sentry, Matomo and rrweb existed and were actively maintained as of my knowledge cutoff. I am confident of that for OpenReplay too but less so about its current licence, and I have explicit doubts about Highlight.io as noted on its entry.

---

This is one model's output at one moment. It is not a survey, not a ranking and not a review.
See the method: https://astroanand-6e.github.io/answer-ledger/method/

Named here and want out? Open a delist request: https://github.com/astroanand-6e/answer-ledger/issues/new?template=delist-brand.yml — free, no email, no payment, ever.
