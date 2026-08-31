# Answer Ledger — Build Contract (Cycle 4)

**Do not deviate.** Agents fill `data/categories/*.json` in parallel against this file.
If you need something not described here, add it to a file you own — never edit a file
you don't own. The generator is owned by `fullstack-dhh`; the data files are not.

**Binding upstream:** `docs/ceo/cycle4-blockade-ruling.md`, `docs/research/cycle4-corpus-vertical.md`.

---

## What this is

A static site, generated locally, committed to git, served by GitHub Pages. There is
no server, no database, and no API call when a visitor arrives. Cost per visitor is
zero and always will be. This is the zero-COGS vehicle ruled in when the credential
blockade killed the Worker funnel; the Worker is mothballed in a separate repo, intact.

## Positioning (fixed — verbatim, do not paraphrase)

> Answer Ledger is a dated, permanent public record of what an AI assistant answers
> when a buyer asks it to recommend software — every page prints the exact prompt, the
> model that answered, and the timestamp, and nothing here is for sale to the vendors
> it names.

It lives in exactly one place: `SITE.positioning` in `src/config.ts`. Note **"an AI
assistant", singular**. We run one engine. "AI assistants", "leading AI models" and
"the major chatbots" are overclaims and are forbidden until a second engine actually
runs.

## Non-negotiable constraints

These are enforced by the generator, not by review. Each one fails the build.

| # | Rule | Enforced by |
|---|---|---|
| 1 | **Engine honesty.** Every page prints the exact model id, the verbatim prompt and a UTC timestamp. All three are required fields with no default, no fallback and no placeholder. | `loadRun()` in `src/load.ts` |
| 2 | **Never name an engine that did not answer.** If a rendered answer page contains "chatgpt", "openai", "gemini", … and no run on that page declares it, the build dies. | `assertEngineHonesty()` in `src/build.ts` |
| 3 | **Category-keyed, never brand-keyed.** A `<title>` or meta description naming a brand that appears in the entry is a build failure. | `assertNotBrandKeyed()` in `src/build.ts` |
| 4 | **One-click delist, no email, no payment, ever.** A delisted name that survives into rendered bytes is a build failure. | `assertDelisted()` in `src/build.ts` |
| 5 | **Hard cap 100 pages, one vertical.** The generator refuses to build page 101. | `loadAll()` in `src/load.ts` |
| 6 | **Deterministic output.** Nothing in the output derives from the build clock, the environment or filesystem ordering. Two builds on unchanged data are byte-identical. | CI, `--check` |

Rule 4 exists because the failure mode of this business model is becoming a
reputation-extortion racket. We do not charge to delist. We do not contact vendors to
solicit anything — not a link, a share, a mention, a reply, or a payment. We will notify
a vendor when we have published a dated correction about them, because naming a party in
a dated public record creates a duty to tell them; that notice carries the delist link,
asks for nothing, and is never followed by a second email. If a message from us ever
asks a vendor for anything, the company has broken its own contract and the issue tracker
is the place to say so.

The earlier wording of this paragraph promised we would never contact a vendor *at all*.
That was a promise about our own convenience, and it was replaced in Cycle 8 — before the
first notice was sent, not after — because we discovered we owed five vendors a
correction notice and would rather change a stated rule in public than quietly break it.
The promise that matters is the absence of an **ask**, and it is enumerated above so it
cannot be satisfied on a technicality.

## Vertical and scope (Cycle 4)

- **Vertical:** developer and SaaS infrastructure tooling, bought by small bootstrapped teams.
- **Categories:** the 20 in `docs/research/cycle4-corpus-vertical.md`, ordered best-first.
  Build for a ceiling of 100; expect 20. If you must cut, cut from the bottom.
- **Prompt template:** use the shared template in that document verbatim, filling
  `{NEED}` and `{CONSTRAINTS}`. **Do not drop the final sentence** — the instruction to
  state uncertainty explicitly is the credibility control, and its output is rendered
  as a first-class block on the page.

---

## Data schema

One JSON file per category at `data/categories/<slug>.json`. The filename **must**
equal `slug + ".json"`. Types are authoritative in `src/types.ts`; this is the prose
version.

```jsonc
{
  "schemaVersion": 1,                 // required, must be 1
  "slug": "error-tracking-flat-price-unlimited-seats",  // required, lowercase-kebab, == filename
  "question": "error tracking that doesn't charge me per developer",
                                      // required. The CATEGORY question, as a buyer
                                      // types it. NEVER names a brand — rule 3.
  "summary": "…",                     // required. One sentence; becomes <meta description>.
                                      // Also category-keyed, also brand-free.
  "delisted": false,                  // required, write it explicitly. true => the whole
                                      // page vanishes: no HTML, no markdown, no sitemap row.
  "provisional": false,               // optional. true renders a visible "recorded while
                                      // the site was being built" banner.

  "runs": [                           // required, non-empty. ONE ELEMENT PER ENGINE.
    {                                 // Adding a second engine later is an APPEND here —
                                      // never a rewrite of the other files.
      "engine": "claude",             // required. Stable short key.
      "model": "claude-opus-5[1m]",   // required. EXACT model id as invoked. Rule 1.
      "modelDisplay": "Claude Opus 5 (Anthropic)",  // required. Human-facing name.
      "prompt": "I run a 3-person bootstrapped SaaS company. I need …",
                                      // required. VERBATIM. Rendered as-is, whitespace kept.
      "ranAt": "2026-08-31T16:20:52Z",// required. UTC, exactly "YYYY-MM-DDTHH:MM:SSZ".
      "retrieval": false,             // required boolean. false => the model had no live
                                      // web access, so every "sources" array MUST be empty.
                                      // Sources with retrieval:false is a build failure.
      "answerExcerpt": "…",           // required. Verbatim opening of the answer. Not a paraphrase.

      "verdict": "…",                 // optional — EXCEPT it is REQUIRED when "brands" is
                                      // empty. The bottom line in one or two sentences.
      "caveats": [                    // optional. The model's own stated uncertainty for the
        "I had no live web access…",  // answer as a whole. RENDERED VISIBLY in its own block.
        "…"                           // Never summarise these away; they are the point.
      ],

      "brands": [                     // MAY BE EMPTY. See "no vendor qualifies" below.
        {
          "name": "Uptime Kuma",      // required. As the model wrote it. May be an
                                      // open-source project or "run it yourself".
          "rank": 2,                  // 1-based position in the model's ordering.
          "note": "…",                // the single strongest reason, from the answer.
          "pricing": "…",             // optional. Pricing model as the model described it.
          "regret": "…",              // optional. "The one thing most likely to make me regret it."
          "caveat": "…",              // optional. The model's uncertainty about THIS item.
                                      // Rendered visibly, never dropped.
          "sources": [                // [] is legal and is rendered honestly as
            {                         // "No source cited". NEVER pad this.
              "url": "https://…",     // required, absolute.
              "domain": "example.com",// optional; derived from url, lowercased, www stripped.
              "title": "…"            // optional; null when unknown. Never invented.
            }
          ]
        }
      ]
    }
  ]
}
```

### The two things people will get wrong

**1. "No vendor qualifies" is a correct answer, not a broken page.**
Several categories are deliberately constructed with constraints that disqualify the
whole market ("a status page that doesn't stamp the vendor's logo on my page"). When
the model's honest answer names nobody, set `"brands": []` and supply `"verdict"`.
The page then renders a *No product was recommended* block with the verdict in display
type, and the heading changes from "What it recommended" to "What it concluded". Do not
invent a vendor to fill the list. Omitting `verdict` with an empty `brands` fails the build.

**2. Uncertainty is content.**
The prompt tells the model to say when it is unsure a product still exists or that its
pricing is current. Capture that in `caveats` (answer-level) and `caveat` (item-level).
It renders in a bordered block under the recommendations, not in a footnote. This is the
one claim a vendor listicle structurally cannot make, so it is the most valuable text on
the page. Never compress it into "some details may be out of date".

---

## Delisting

Two levers, both honored on the next build.

| Lever | Where | Effect |
|---|---|---|
| Whole category | `"delisted": true` in the category file | Page not generated; removed from index, sitemap and markdown mirror. `404.html` explains removals honestly. |
| One brand, everywhere | add the lowercased name to `brands` in `data/delisted-brands.json` | Dropped from every ranked list; dropped from cited sources by domain; **replaced with a visible `[removed at owner's request]` marker inside otherwise-verbatim prose**; each affected page shows a neutral "this record has been edited" notice that does not name them. |

Redaction rather than silent rewriting is deliberate: an edited quote must look edited,
or the "verbatim" promise on every other page is worthless.

The public path is `.github/ISSUE_TEMPLATE/delist-brand.yml`. No email address is
required or wanted. **There is no pay-to-delist and there never will be.**

## File ownership

| Path | Owner |
|---|---|
| `src/**`, `CONTRACT.md`, `README.md` | fullstack-dhh |
| `data/categories/*.json` | whoever runs the prompts (research/content) |
| `data/delisted-brands.json` | anyone processing a delist issue |
| `.github/**`, `scripts/**`, `metrics/**` | devops-hightower |
| `docs/**`, `answers/**` | **generated — never hand-edit.** CI fails if they disagree with `data/`. |
