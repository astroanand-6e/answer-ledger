#!/usr/bin/env bash
# Cycle 4 Traffic Gate meter. Appends one dated JSON line to metrics/traffic.jsonl.
#
# GitHub's traffic API only keeps a rolling 14-day window: a day you did not
# snapshot is a number that no longer exists. Run this DAILY. Everything here
# degrades to null rather than failing, because a partial line is evidence and
# a crashed cron job is not.
#
#   bash scripts/traffic-snapshot.sh            # uses SITE.repo default below
#   REPO=owner/name bash scripts/traffic-snapshot.sh
set -uo pipefail

REPO="${REPO:-astroanand-6e/answer-ledger}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$DIR/metrics/traffic.jsonl"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
mkdir -p "$DIR/metrics"

if ! command -v gh >/dev/null 2>&1; then
  echo "{\"at\":\"$NOW\",\"repo\":\"$REPO\",\"error\":\"gh not installed\"}" >> "$OUT"
  echo "traffic-snapshot: gh missing; wrote error line" >&2
  exit 0
fi

api() { gh api -H "Accept: application/vnd.github+json" "$1" 2>/dev/null; }

VIEWS="$(api "repos/$REPO/traffic/views")"
CLONES="$(api "repos/$REPO/traffic/clones")"
REFERRERS="$(api "repos/$REPO/traffic/popular/referrers")"
PATHS="$(api "repos/$REPO/traffic/popular/paths")"

# Demand-intent metric: non-team "request a category" issues.
REQ="$(gh issue list --repo "$REPO" --label "category-request" --state all --limit 200 \
        --json number,author,createdAt 2>/dev/null)"
DELIST="$(gh issue list --repo "$REPO" --label "delist" --state all --limit 200 \
        --json number,createdAt 2>/dev/null)"

# -c: ONE record per line. This file is .jsonl and the Traffic Gate is read
# from it line by line; pretty-printed output makes an 84-line record and the
# second append makes the file unparseable as anything at all.
jq -c -n \
  --arg at "$NOW" --arg repo "$REPO" \
  --argjson views "${VIEWS:-null}" \
  --argjson clones "${CLONES:-null}" \
  --argjson referrers "${REFERRERS:-null}" \
  --argjson paths "${PATHS:-null}" \
  --argjson requests "${REQ:-null}" \
  --argjson delists "${DELIST:-null}" \
  '{
     at: $at,
     repo: $repo,
     views_14d:   ($views.count       // null),
     uniques_14d: ($views.uniques     // null),
     clones_14d:  ($clones.uniques    // null),
     referrers: ( ($referrers // [])
                  | map({referrer, count, uniques}) ),
     external_referrers: ( ($referrers // [])
                  | map(select(.referrer
                        | test("github\\.com|github\\.io|^Google$") | not))
                  | length ),
     top_paths: ( ($paths // []) | map({path, count, uniques}) | .[0:10] ),
     category_requests: ( ($requests // []) | length ),
     delist_requests:   ( ($delists  // []) | length ),
     daily_views: ( ($views.views // []) | map({t: .timestamp, c: .count, u: .uniques}) )
   }' >> "$OUT" 2>/dev/null \
  || echo "{\"at\":\"$NOW\",\"repo\":\"$REPO\",\"error\":\"snapshot failed; api unreachable or jq missing\"}" >> "$OUT"

# Guard the invariant rather than trusting it: one record MUST be one line.
BAD="$(grep -cve '^{.*}$' "$OUT" || true)"
if [ "${BAD:-0}" -gt 0 ]; then
  echo "traffic-snapshot: ERROR — $BAD line(s) in $OUT are not a complete JSON object." >&2
  echo "traffic-snapshot: the gate cannot be read from this file. Fix before trusting any number." >&2
  exit 1
fi

echo "traffic-snapshot: appended to metrics/traffic.jsonl ($(wc -l < "$OUT" | tr -d ' ') records total)"
