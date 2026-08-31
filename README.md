# Answer Ledger

> Answer Ledger is a dated, permanent public record of what an AI assistant answers when
> a buyer asks it to recommend software — every page prints the exact prompt, the model
> that answered, and the timestamp, and nothing here is for sale to the vendors it names.

Static site. Generated locally, committed to git, served by GitHub Pages. No server, no
database, no API call when you visit, no cost per visitor.

- **Site:** https://astroanand-6e.github.io/answer-ledger/
- **Method (read this first):** https://astroanand-6e.github.io/answer-ledger/method/
- **Build contract and data schema:** [`CONTRACT.md`](CONTRACT.md)

## GitHub Pages configuration this build expects

**Settings → Pages → Source: “Deploy from a branch”, branch `main`, folder `/docs`.**
That is the only supported combination, because GitHub's branch-folder option offers
exactly `/` and `/docs`, and the generator writes to `docs/`. It also emits `docs/.nojekyll`
so Pages serves the files as-is instead of running Jekyll over them. Do not switch to a
GitHub Actions Pages deployment: publishing from the committed tree is what makes the
corpus auditable — the bytes that ship are the bytes in the repo, and any change to a
published answer shows up as a reviewable diff.

**Attaching a custom domain later** preserves every URL, which is the whole reason we are
on Pages. When it happens: set `CANONICAL_ORIGIN` to the new host and `BASE_PATH` to `""`
in `src/config.ts`, add a `docs/CNAME` file (the build preserves it), run `npm run build`,
commit. Every path below the base is unchanged and the accumulated indexation carries over.
Those two constants are the only place the host appears; every internal link goes through
the `href()` helper, so there is nothing else to find and replace.

## Rules

These are enforced by the generator. Each one fails the build, not the code review.

1. **Engine honesty.** Every page names the exact model, prints the verbatim prompt, and
   carries a UTC timestamp. All three are required data fields with no default and no
   fallback. The model name is rendered from data and is never written in prose.
2. **We never print the name of an assistant that did not answer.** If an answer page
   contains an engine name that no run on it declares, the build dies. We have one engine.
   Copy says "an AI assistant", singular — "AI assistants" is an overclaim.
3. **Category-keyed, never brand-keyed.** Titles and descriptions describe the question.
   A title naming a brand in the entry fails the build.
4. **One-click delist, free, no email, and no payment. Ever.** Open an issue; on the next
   build the name is gone from every page, the index and the sitemap. We will never charge
   to remove anyone, and never contact a vendor to solicit anything — no link, share,
   mention, reply or payment. The one message a vendor may ever get from us is notice that
   we published a dated correction about them; it asks for nothing and has no follow-up.
5. **Hard cap: 100 pages, one vertical.** The generator refuses to build page 101.
6. **Deterministic output.** Two builds on unchanged data are byte-identical, so a change
   to a published answer is always a readable diff.

## Layout

```
data/categories/<slug>.json   source of truth, one file per category   (hand-authored)
data/delisted-brands.json     names removed on request                 (hand-authored)
src/                          the generator, ~700 lines, zero runtime deps
docs/                         GENERATED — the published site (Pages serves this)
answers/<slug>.md             GENERATED — markdown mirror, indexed on github.com
metrics/traffic.jsonl         append-only daily traffic snapshots
```

`docs/` and `answers/` are build output. Never hand-edit them; CI fails if they disagree
with `data/`.

Publishing twice is deliberate: canonical HTML on Pages, plus markdown in the repo, which
github.com indexes quickly. Two crawl paths, one artifact, no extra cost.

## Adding a category

1. Run the shared prompt from `docs/research/cycle4-corpus-vertical.md` with `{NEED}` and
   `{CONSTRAINTS}` filled in. Keep the final sentence, the one asking the model to state
   when it is unsure — its output is rendered as a first-class block on the page.
2. Write `data/categories/<slug>.json`. The filename must equal the slug. Schema and the
   two things people get wrong are in [`CONTRACT.md`](CONTRACT.md).
3. `npm run build`
4. Commit `data/`, `docs/` and `answers/` together, in one commit.

If the honest answer names no vendor at all — which several of these categories are built
to produce — set `"brands": []` and write a `"verdict"`. That renders as a finding, not as
an empty page.

## Commands

```bash
npm run build      # regenerate docs/ and answers/ from data/
npm run check      # fail if the committed site is out of date with data/  (this is CI)
npm run typecheck  # tsc --noEmit
npm run metrics    # append a traffic + referrer snapshot to metrics/traffic.jsonl
```

Node 22.6+ (the generator is TypeScript run directly by Node's type stripping — no bundler,
no build step, no runtime dependencies). `typescript` and `@types/node` are devDependencies
used only by `npm run typecheck`.

## Measurement

`scripts/traffic-snapshot.sh` appends one JSON line per run to `metrics/traffic.jsonl`:
views, uniques, referrers, top paths, and counts of category-request and delist issues.
It degrades to a line containing an `error` field rather than failing, because a partial
record is evidence and a dead cron job is not.

**Run it daily.** GitHub's traffic API keeps a rolling 14-day window: a day that was not
snapshotted is a number that no longer exists anywhere. `.github/workflows/metrics.yml`
does this on a schedule and commits the result.

## What this is not

Not a survey, not a ranking, not a review, not statistically meaningful, and not paid for.
One model, one run, one moment, published with the receipts and the model's own stated
uncertainty attached. The [method page](https://astroanand-6e.github.io/answer-ledger/method/)
says all of this in full, and it is the page to attack first if you think we are overclaiming.
