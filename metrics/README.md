# How the Traffic Gate is read

**Authoritative as of 2026-08-31 (Cycle 8). Author: devops-hightower.**
**Binding upstream:** `docs/critic/cycle6-outreach-premortem.md` in the parent repo —
Rulings 1–4, V4, V5, and conditions C1(i)–(v).

This file is the definition of the measurement. It exists because of Munger's V5:

> **A gate reading taken against an unwritten definition is void, and ambiguity
> resolves against the project.** Void kills; it does not rescue.

So the arithmetic is written here **before** anyone knows the answer. Committing it
afterwards is not arithmetic, it is advocacy. If you find this file ambiguous on gate
day, the gate has already failed — do not resolve the ambiguity, record it and kill.

Any amendment to this file after 2026-09-01 must be a dated entry in
[Amendments](#amendments) with the git commit that made it, and it voids every reading
taken before it unless the amendment is purely typographical.

---

## The gate

Read on **2026-09-30**. Set on 2026-08-31 (day 0). All four must hold. Missing any one
kills the project; there is no partial credit and no extension.

| # | Criterion | Threshold | Source file |
|---|---|---|---|
| 1 | Unique visitor-days over the 30-day window | **≥ 300** | `metrics/traffic.jsonl` |
| 2 | Distinct admissible external referrers | **≥ 1** | `metrics/traffic.jsonl` |
| 3 | Canonical URLs indexed by Google | **≥ 20** | `metrics/indexation.jsonl` |
| 4 | Non-team category requests | **≥ 5** | `metrics/traffic.jsonl` |

**The window** is the 30 calendar days **2026-09-01 through 2026-09-30 inclusive**, UTC.
2026-08-31 is day 0, the baseline, and is **excluded** — its snapshot is all zeros and
counting it would be counting the pre-launch state. Every date comparison below is a
lexicographic string compare on ISO-8601 UTC, which is why every timestamp in these
files is `YYYY-MM-DDTHH:MM:SSZ` and must stay that way.

---

## Which website this measures — read this before you read any number

`metrics/traffic.jsonl` is produced by `scripts/traffic-snapshot.sh`, which calls
`repos/{owner}/{repo}/traffic/*`. **That API measures views of
`github.com/astroanand-6e/answer-ledger`. It does not measure, and has never measured,
`astroanand-6e.github.io/answer-ledger`.** GitHub Pages has no built-in analytics and we
have no credential for a third-party counter.

Therefore, decided in writing on 2026-08-31 and recorded in
`docs/devops/cycle8-instrument.md`:

> **Every promoted URL points at the github.com surface** — the repository, or the
> markdown mirror of a specific answer at
> `https://github.com/astroanand-6e/answer-ledger/blob/main/answers/<slug>.md`.
> Criteria 1, 2 and 4 measure that surface, exactly and honestly.
> **Criterion 3 measures the Pages surface**, which is the canonical, indexable
> artifact and is what `docs/sitemap.xml` lists.

Two surfaces, each measured by the criteria that can actually see it. **The
Pages URL is not promoted during this window.** If someone promotes a
`github.io` URL anyway, say so out loud: uniques and referrers from that link are
invisible to this meter, and the reading for criteria 1 and 2 becomes an undercount of
unknown size — which under V5 is a void, not a benefit of the doubt.

---

## Criterion 1 — ≥300 uniques over 30 days

### The definition

**U30 = the sum, over the 30 calendar days in the window, of `daily_views[].u` for that
day, taking for each calendar day the value from the snapshot with the greatest `at`
that contains it, and ignoring any snapshot with `degraded: true` or an `error` field.**

Read plainly: **U30 counts unique visitor-days.** A person who visits on three days
counts three. That is the quantity the threshold 300 now means, permanently.

### Why this and not `uniques_14d`

`uniques_14d` is GitHub's rolling **14-day** deduplicated unique count. The gate is 300
over **30** days. Three candidate operations existed and only one is defensible:

1. **Read `uniques_14d` on 2026-09-30.** Silently discards days 1–16 of the window —
   more than half the measurement period, including the launch spike, which is exactly
   where the traffic would be. Rejected: it answers a different question than the one
   asked.
2. **Sum `uniques_14d` across snapshots.** Arithmetically meaningless. Each daily
   snapshot's 14-day figure overlaps the previous one by 13 days, so this
   double-counts by roughly 14×. Rejected outright.
3. **Sum daily uniques (chosen).** Complete over the window, mechanically computable
   from committed data, and monotone in real traffic.

The honest cost of option 3, stated before the reading rather than after: it is
**biased upward** relative to a true 30-day distinct-visitor count, because a returning
visitor is counted once per day. The size of that bias is bounded by the return rate,
and for a cold-start referral site with no accounts, no email list and no reason to
return, the return rate is near zero — the regime we are actually in is the regime where
the two quantities nearly coincide. Option 1 is biased downward and is *also* incomplete;
between an upward-biased complete measure and a downward-biased incomplete one, the
complete one is the instrument. The bias direction is now on the record and cannot be
discovered conveniently on day 30 by whichever side it favours.

`views_14d` / `daily_views[].c` (raw page views) are **not** the gate metric and must not
be substituted. They are recorded for context only.

### The command

```bash
jq -s '[ .[] | select((.degraded == true) or has("error") | not)
             | .at as $at | (.daily_views // [])[] | {d: (.t[0:10]), u: .u, at: $at} ]
  | map(select(.d >= "2026-09-01" and .d <= "2026-09-30"))
  | group_by(.d) | map(max_by(.at)) | map(.u) | add // 0' metrics/traffic.jsonl
```

Fields used: `daily_views[].t` (calendar day), `daily_views[].u` (unique visitors that
day), `at` (snapshot time, used only to pick the latest value for a day), `degraded`.

**Why `max_by(.at)`:** GitHub's 14-day window means one calendar day appears in up to 14
consecutive snapshots, and its value can still be rising in the snapshot taken *during*
that day. The latest snapshot that contains a day holds its settled value. Deduping by
`t` and taking the latest `at` is the whole of Ruling 2's "exact operation".

**Pass if the number is ≥ 300.**

---

## Criterion 2 — ≥1 external referrer

### The definition

**R = the count of distinct referrer strings (case-insensitive) appearing in
`referrers[].referrer` in any non-degraded snapshot whose `at` falls in the window,
after removing (a) GitHub's own and Google's own domains and (b) every domain listed in
`metrics/excluded-referrers.txt`.**

(b) is Munger's V4 / Ruling 9: a referrer traceable to one of the five vendor
notifications does not count. `metrics/excluded-referrers.txt` is the mechanism; adding a
line to it after a reading voids that reading.

### The command

```bash
EXCL="$(grep -v '^[[:space:]]*#' metrics/excluded-referrers.txt | tr -d ' \t\r' \
        | grep -v '^$' | tr 'A-Z' 'a-z' | jq -R . | jq -s -c .)"
jq -s --argjson excl "$EXCL" '
  [ .[] | select((.degraded == true) or has("error") | not)
        | select(.at >= "2026-09-01" and .at < "2026-10-01") | (.referrers // [])[] ]
  | map(select(.referrer | ascii_downcase | test("github\\.com|github\\.io|^google$") | not))
  | map(select(.referrer | ascii_downcase | IN($excl[]) | not))
  | group_by(.referrer | ascii_downcase) | map(.[0].referrer)' metrics/traffic.jsonl
```

The command prints the referrer list; **pass if its length is ≥ 1.** Append `| length`
for just the number. Print the list, not the number, and paste it into the reading —
a referrer we cannot name is a referrer we should not count.

Note the exclusion of `github.com` is what makes this criterion hard even under the
option-(a) URL decision: a link posted on GitHub itself is not an external referrer.
`^google$` is excluded because organic search is not distribution.

---

## Criterion 3 — ≥20 URLs indexed

Measured from `metrics/indexation.jsonl`, written by `scripts/indexation-check.sh`.
**This number is entered by a human.** There is no credential-free automated way to
count indexed URLs: Search Console needs site verification plus OAuth, and a scraped
`site:` query is blocked (tried 2026-08-31 against `html.duckduckgo.com`: HTTP 202
anti-bot challenge). A scraper that silently returns 0 is worse than no meter, because
0 is a number the gate would believe.

### The procedure — follow it verbatim, every time

Run `bash scripts/indexation-check.sh` with no arguments and it prints this. Repeated
here so the definition does not live only in a script:

1. Open a browser window with **no Google account signed in** (private/incognito).
2. Search, verbatim: `site:astroanand-6e.github.io/answer-ledger`
3. Go to the **last** page of results and **count rows** — distinct URLs under
   `https://astroanand-6e.github.io/answer-ledger`. **Do not use the "About N results"
   estimate**; it is an estimate and it is wrong at small N. If Google offers "repeat the
   search with omitted results included", click it and count that list.
4. Log it: `bash scripts/indexation-check.sh --indexed <N>`
5. A zero is a reading. Log it.

The script also records, automatically, `urls_in_sitemap` (22 as of 2026-08-31) and
`urls_live` (how many of those return HTTP 200 — all 22 did on 2026-08-31). Those exist
to catch a bad hand-entry: you cannot have more URLs indexed than are live, and the
script warns if you claim otherwise. `N` is bounded above by `urls_in_sitemap`.

**Cadence:** at least weekly. `.github/workflows/metrics.yml` has an
`indexation-freshness` job that turns the Actions tab **red** if the newest reading is
more than 8 days old, because an unmeasured criterion is a future argument.

**Day-14 stop rule** (from `memories/consensus.md`, now enforceable): read this meter on
**2026-09-14**. If `indexed < 5`, stop. The value of a leading indicator is entirely in
being obeyed on the one occasion it is inconvenient.

### The command

```bash
jq -s '[ .[] | select(.at < "2026-10-01") | select(.indexed != null) ]
  | (last | .indexed) // "NO READING TAKEN"' metrics/indexation.jsonl
```

**Pass if the number is ≥ 20.** If it prints `NO READING TAKEN`, criterion 3 is
unmeasured and **the whole reading is void** — see below.

---

## Criterion 4 — ≥5 non-team category requests

### The definition

**Q = the maximum value of `category_requests_nonteam` across all non-degraded snapshots
with `at` before 2026-10-01.**

`category_requests_nonteam` is computed in `scripts/traffic-snapshot.sh` as: issues
labelled `category-request` (any state), **minus** every issue whose `author.login`
appears in `metrics/team-handles.txt` (case-insensitive, exact), **minus** every author
whose login ends in `[bot]` or whom GitHub reports as `is_bot: true`. This is Ruling 4:
team-authored requests are inadmissible. The raw, unfiltered count is still recorded as
`category_requests` — the gate does **not** read it.

`max` rather than "last" because issue counts are cumulative and monotone; taking the max
means a single degraded or post-window snapshot cannot erase a real request. Adding a
handle to `metrics/team-handles.txt` after a reading voids that reading.

### The command

```bash
jq -s '[ .[] | select((.degraded == true) or has("error") | not)
             | select(.at < "2026-10-01")
             | select(has("category_requests_nonteam")) | .category_requests_nonteam ]
  | max // 0' metrics/traffic.jsonl
```

**Pass if the number is ≥ 5.**

### Show the authors

Required alongside the number, so the filter is auditable rather than trusted:

```bash
jq -s -r '[ .[] | select(has("category_request_authors")) ] | last
  | (.category_request_authors // [])[]
  | "#\(.n)  \(.a)  team=\(.team)  \(.at)"' metrics/traffic.jsonl
```

### The known leak in this criterion

`blank_issues_enabled` is true, so a stranger who clicks "New issue" and types a request
in the blank form lands **unlabelled**, and a label filter reads zero while the demand
sits in the tracker. Until Cycle 8 that request was invisible. The snapshot now fetches
*every* issue and publishes `unclassified_nonteam` — non-team issues carrying neither
label. **If `unclassified_nonteam > 0` on gate day, a human must open those issues and
label them before the reading is taken**, and the labelling commit must precede the
reading commit in `git log`. Labelling a stranger's genuine request is correcting the
instrument; inventing a label for a borderline issue after seeing the score is
advocacy, and the git order is what distinguishes them.

```bash
jq -s '[ .[] | select(has("unclassified_nonteam")) ] | last | .unclassified_nonteam' metrics/traffic.jsonl
```

---

## What makes a reading void

Void is not neutral. **A void reading kills the project** (V5): ambiguity resolves
against the project, because that is the only direction it can resolve without corrupting
every future gate this company sets. A reading is void if **any** of the following is
true on 2026-09-30:

1. **`metrics/indexation.jsonl` contains no record with a non-null `indexed`** dated in
   the window. Criterion 3 is then unmeasured.
2. **More than 3 of the 30 calendar days in the window have no non-degraded
   `daily_views` entry.** GitHub's traffic API keeps 14 days; a day nobody snapshotted is
   a number that no longer exists anywhere on earth. Four or more missing days means U30
   is an undercount of unknown size, and an unknown undercount cannot be compared to 300.
3. **Any of `metrics/team-handles.txt`, `metrics/excluded-referrers.txt`, or this file was
   modified on or after the date of the reading**, other than typographically.
4. **A promoted URL pointed at `astroanand-6e.github.io`** during the window (see "Which
   website this measures"), because criteria 1 and 2 then measured a surface the traffic
   did not use.
5. **A line in `metrics/traffic.jsonl` is not a complete single-line JSON object**, or the
   file cannot be parsed by `jq -s`.
6. **The reading was taken from any file, field or command not named in this document.**

### The void check — run this FIRST, before any of the four criteria

```bash
jq -s -r '
  ([ .[] | select((.degraded == true) or has("error") | not)
         | (.daily_views // [])[] | (.t[0:10]) ]
    | map(select(. >= "2026-09-01" and . <= "2026-09-30")) | unique) as $covered
  | ([ .[] | select((.degraded == true) or has("error")) | .at ]) as $bad
  | "days covered: \($covered | length)/30",
    "missing days: \(30 - ($covered | length))   (VOID if > 3)",
    "degraded/error snapshots: \($bad | length)",
    ($bad | if length > 0 then "  " + join(", ") else "  none" end)' metrics/traffic.jsonl
```

```bash
# invariant: one record MUST be one line
grep -cve '^{.*}$' metrics/traffic.jsonl   # must print 0
grep -cve '^{.*}$' metrics/indexation.jsonl # must print 0
```

Run the void check first, publish its output with the reading, and if it says void then
**stop and record the void.** Do not proceed to the four numbers. The reason to run it
first is that nobody can resist a number once they have seen it.

---

## Files and what writes them

| File | Written by | Contains |
|---|---|---|
| `metrics/traffic.jsonl` | `scripts/traffic-snapshot.sh` (daily, via `.github/workflows/metrics.yml`) | one record per run; append-only |
| `metrics/indexation.jsonl` | `scripts/indexation-check.sh` (weekly, human-entered count) | one record per check; append-only |
| `metrics/team-handles.txt` | hand-maintained | inadmissible authors (Ruling 4) |
| `metrics/excluded-referrers.txt` | hand-maintained | referrers excluded by V4 |

**Both `.jsonl` files are append-only. Never edit or delete a line.** The product of this
company is the proposition that a dated record is not negotiable; the scoreboard is held
to the same standard as the answer pages.

### Record schema, `metrics/traffic.jsonl`

`schema: 2` records (Cycle 8 onward). `schema: 1` records lack `degraded`,
`category_requests_nonteam` and `unclassified_nonteam`; the commands above skip them via
`select(has(...))`, and the two pre-Cycle-8 `{"error": ...}` lines are skipped via
`has("error")`.

| Field | Meaning |
|---|---|
| `at` | snapshot time, UTC |
| `schema` | `2` |
| `measures` | fixed string, a standing reminder of the surface: github.com repo traffic |
| `degraded` | **true if any endpoint failed.** A degraded record is evidence, not data |
| `api_errors` | why, in plain words |
| `views_14d`, `uniques_14d`, `clones_14d` | GitHub's rolling 14-day figures. Context only — `uniques_14d` is **not** the gate metric |
| `daily_views[]` | `{t, c, u}` per calendar day: the honest basis for criterion 1 |
| `referrers[]`, `external_referrers` | `external_referrers` is a convenience count, **not** V4-filtered. Criterion 2 uses the command above |
| `top_paths[]` | top 10 paths on the github.com surface |
| `category_requests` | raw count, all authors. Not the gate metric |
| `category_requests_nonteam` | **the gate metric for criterion 4** |
| `category_request_authors[]` | `{n, a, team, at}` per request — the audit trail |
| `delist_requests`, `delist_requests_nonteam` | same treatment; not a gate criterion, but a rising delist count shrinks the corpus and attacks criterion 3 |
| `unclassified_nonteam` | non-team issues with neither label — the leak described above |
| `team_handles_applied` | how many handles the filter loaded. **If this is 0, Ruling 4 did not run** |

---

## Running the meter

```bash
bash scripts/traffic-snapshot.sh       # daily; exit 1 means it read nothing
bash scripts/indexation-check.sh       # prints the procedure, logs nothing
bash scripts/indexation-check.sh --indexed 7
```

### The credential problem, stated plainly

`repos/{owner}/{repo}/traffic/*` requires a token with repository
**Administration: read** (classic scope: `repo`). **`administration` is not an available
key in a GitHub Actions `permissions:` block**, so `secrets.GITHUB_TOKEN` cannot hold it
and returns `403 Must have push access to repository` on every traffic endpoint,
permanently. This is why the 2026-08-31 CI runs wrote error lines while showing a green
check.

To make CI able to read traffic, exactly one thing is needed:

```bash
# a FINE-GRAINED PAT, scoped to astroanand-6e/answer-ledger only, with
# Administration: read + Issues: read + Contents: write
gh secret set METRICS_TOKEN --repo astroanand-6e/answer-ledger
```

`.github/workflows/metrics.yml` already prefers `secrets.METRICS_TOKEN` and falls back to
`GITHUB_TOKEN`. Until that secret exists, **the daily snapshot must be run from a machine
with `gh auth login` as the repo owner**, where it works today. A day nobody snapshots is
a day that stops existing — and under "What makes a reading void" rule 2, four such days
kill the project.

---

## Amendments

| Date | Commit | Change | Voids readings before |
|---|---|---|---|
| 2026-08-31 | (this commit) | Created. Cycle 8, per Munger Rulings 1–4, V4, V5, C1(i)–(v). | n/a |
