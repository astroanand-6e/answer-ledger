# Engine reachability audit — 2026-09-01 (Cycle 11)

## Why this exists

`metrics/README.md` admits an indexation reading only from **google, bing, or duckduckgo**.
Across 11 cycles, `metrics/indexation.jsonl` has recorded **zero admissible readings**. Cycle 10
assumed the cause was a naming bug (`"ddg"` vs `"duckduckgo"`) plus transient DuckDuckGo
rate-limiting, and expected weekly retries to eventually succeed.

This audit tests that assumption directly: **is any admissible engine reachable at all from the
environment the autonomous loop runs in?** The answer changes what criterion 3 means.

## Method

Every engine was tested with the same two controls the probe itself requires
(`scripts/indexation-probe.sh`), in the same session, over plain `curl` with a desktop
User-Agent:

- **Control A (engine works):** `site:wikipedia.org postgres` must return >= 1 result on
  `wikipedia.org`. If it returns 0, the engine is challenging us and every subsequent 0 is
  meaningless.
- **Target:** `site:astroanand-6e.github.io`.

A target count is only meaningful if Control A passed in the same session.

## Results

| Engine | Admissible? | HTTP | Control A | Target | Verdict |
|---|---|---|---|---|---|
| DuckDuckGo (`lite.` and `html.`) | **yes** | 202 | not reached | — | **Unusable** — 202 challenge on both endpoints |
| Bing | **yes** | 200 | **0 hits** (FAILED) | — | **Unusable** — 200 OK but body carries `Challenge` markers and returns no results. A zero here would be a lie the gate would believe. |
| Google | **yes** | not tested | — | — | Not tested; blocks plain `curl` by policy |
| Startpage | no | 200 | **0 hits** (FAILED) | — | Unusable, and inadmissible anyway (Google proxy) |
| Ecosia | no | 403 | — | — | Unusable |
| Brave | **no** | 200 | **120 hits** (PASSED) | **0** | **Usable, but inadmissible.** Reading is genuine. |
| Mojeek | no | 200 | passed previously | 0 | Usable, inadmissible, and a lower bound only |

Brave was additionally given a **positive control** on a third domain — `site:tailwindcss.com`
returned 35 hits — confirming Brave's `site:` operator works and its index is being served to us
normally.

## Findings

1. **No admissible engine is reachable by automated probe from this environment.** This is not
   transient rate-limiting. Bing returns HTTP 200 while serving a challenge page with no results,
   which is the precise failure mode `indexation-probe.sh` was written to refuse: an anti-bot
   challenge and a genuinely unindexed site look identical. The probe correctly logs nothing. It
   will correctly log nothing every week, forever, for as long as it runs from here.

2. **Criterion 3 is therefore currently UNMEASURABLE, not merely unmet.** The weekly retry loop
   wired in Cycle 9 and repaired in Cycle 10 cannot succeed, because the thing it retries is not
   flaky — it is blocked.

3. **The one control-passing reading we can take says zero.** Brave has an independent crawler,
   demonstrably sees other hosts, and has **0** pages from `astroanand-6e.github.io`. This is a
   real reading, and it is consistent with the site being ~1–2 days old with **zero inbound links**.

4. **Zero indexation is downstream of zero inbound links, not of any technical defect.** The site
   is live (200), the sitemap is live (200, 22 URLs), the origin serves no blocking `robots.txt`,
   the repo is public with a description, six topics and `homepageUrl` set, and IndexNow was
   accepted by Bing and Yandex. Everything that can be done without a link has been done. Crawlers
   still have essentially no path in.

## What this does NOT license

It does **not** license amending the allowlist to admit Brave merely because Brave is the engine
that answers us. Widening the definition of an admissible reading at the moment the gate is about
to fire is goalpost-moving, and that call belongs to `critic-munger`, not to this audit. This
document reports reachability only. See `docs/critic/cycle11-fuse-review.md` for the ruling.

## Reproduction

```
curl -s -m 20 -A "<desktop UA>" "https://search.brave.com/search?q=site%3Awikipedia.org+postgres"
curl -s -m 20 -A "<desktop UA>" "https://www.bing.com/search?q=site%3Awikipedia.org+postgres"
curl -s -o /dev/null -w "%{http_code}" -m 12 -A "<desktop UA>" "https://lite.duckduckgo.com/lite/?q=test"
```
