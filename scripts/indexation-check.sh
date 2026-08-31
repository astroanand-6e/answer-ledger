#!/usr/bin/env bash
# Indexation meter. Appends one dated JSON line to metrics/indexation.jsonl.
#
# WHY THIS IS PART-MANUAL. "≥20 URLs indexed" is one of four Traffic Gate
# criteria and it gated a day-14 stop rule, and until Cycle 8 nothing measured
# it at all. The honest options with zero credentials are:
#   - Google Search Console API: needs site verification + OAuth. We have neither.
#   - Scraping a `site:` query: tried 2026-08-31 against html.duckduckgo.com and
#     got HTTP 202 (anti-bot challenge). Google and Bing block it harder. A
#     scraper that silently returns 0 is worse than no meter, because 0 is a
#     number the gate will believe.
#   - A human runs one `site:` query in a browser and types the number here.
# We chose the third. A hand-logged number with a written procedure beats an
# unmeasurable criterion. The two AUTOMATED fields below (urls_in_sitemap,
# urls_live) exist so that a wrong hand-entered number is detectable: you
# cannot have more URLs indexed than are live, and you cannot claim 20 indexed
# when 6 URLs are 404ing.
#
# USAGE
#   bash scripts/indexation-check.sh                   # print the procedure, log nothing
#   bash scripts/indexation-check.sh --indexed 7       # log a real hand-counted number
#   bash scripts/indexation-check.sh --indexed unknown # log the automated fields only
#   bash scripts/indexation-check.sh --indexed 7 --engine bing --note "…"
#
# The exact procedure is in metrics/README.md §"Criterion 3". Follow it verbatim;
# a count taken by a different method is not comparable to the previous counts.
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$DIR/metrics/indexation.jsonl"
SITEMAP="$DIR/docs/sitemap.xml"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ORIGIN="https://astroanand-6e.github.io/answer-ledger"

INDEXED=""; ENGINE="google"; NOTE=""; BY="${INDEXATION_CHECKED_BY:-$(git config user.name 2>/dev/null || echo unknown)}"
while [ $# -gt 0 ]; do
  case "$1" in
    --indexed) INDEXED="${2:-}"; shift 2 ;;
    --engine)  ENGINE="${2:-}";  shift 2 ;;
    --note)    NOTE="${2:-}";    shift 2 ;;
    --by)      BY="${2:-}";      shift 2 ;;
    *) echo "indexation-check: unknown argument '$1'" >&2; exit 2 ;;
  esac
done

QUERY="site:astroanand-6e.github.io/answer-ledger"

if [ -z "$INDEXED" ]; then
  cat <<EOF
indexation-check: nothing logged. This meter needs one number from a human.

PROCEDURE (do it exactly this way every time, or the counts are not comparable):
  1. Open a browser window with no Google account signed in
     (a private/incognito window is enough).
  2. Search, verbatim:
         $QUERY
  3. Scroll to the LAST page of results and count the distinct URLs under
     $ORIGIN that Google lists. Do not use the
     "About N results" estimate — it is an estimate and it lies at small N.
     Count rows. If Google offers "repeat the search with omitted results
     included", click it and count that list.
  4. Record the number:
         bash scripts/indexation-check.sh --indexed <N>
  5. If N is 0 and the site has been live over a week, check
     https://astroanand-6e.github.io/answer-ledger/robots.txt is reachable and
     the sitemap has been submitted; log --indexed 0 anyway. A zero is a reading.

The gate criterion is: N >= 20 on the gate date.
The day-14 stop rule is: N < 5 on day 14 => stop.
There are $(grep -c '<loc>' "$SITEMAP" 2>/dev/null || echo '?') URLs in the sitemap, so N is bounded above by that.
EOF
  exit 1
fi

# --- automated corroboration: how many canonical URLs actually resolve 200 ---
URLS=(); LIVE=0; DEAD=()
if [ -f "$SITEMAP" ]; then
  while IFS= read -r u; do URLS+=("$u"); done < <(sed -n 's/.*<loc>\(.*\)<\/loc>.*/\1/p' "$SITEMAP")
fi
for u in "${URLS[@]+"${URLS[@]}"}"; do
  code="$(curl -sS -m 15 -o /dev/null -w '%{http_code}' "$u" 2>/dev/null || echo 000)"
  if [ "$code" = "200" ]; then LIVE=$((LIVE+1)); else DEAD+=("$u ($code)"); fi
done

if [ "$INDEXED" = "unknown" ]; then IDX_JSON="null"; else
  case "$INDEXED" in ''|*[!0-9]*) echo "indexation-check: --indexed must be an integer or 'unknown'" >&2; exit 2 ;; esac
  IDX_JSON="$INDEXED"
fi

jq -c -n \
  --arg at "$NOW" --arg engine "$ENGINE" --arg query "$QUERY" \
  --arg by "$BY" --arg note "$NOTE" \
  --argjson indexed "$IDX_JSON" \
  --argjson sitemap "${#URLS[@]}" --argjson live "$LIVE" \
  --argjson dead "$(printf '%s\n' "${DEAD[@]+"${DEAD[@]}"}" | grep -v '^$' | jq -R . | jq -s -c .)" \
  '{at:$at, method:"manual-site-query", engine:$engine, query:$query,
    indexed:$indexed, urls_in_sitemap:$sitemap, urls_live:$live, urls_not_200:$dead,
    checked_by:$by, note:(if $note=="" then null else $note end)}' >> "$OUT"

if [ "$IDX_JSON" != "null" ] && [ "$IDX_JSON" -gt "$LIVE" ]; then
  echo "indexation-check: WARNING — you logged $IDX_JSON indexed but only $LIVE of ${#URLS[@]} canonical URLs return 200." >&2
  echo "indexation-check: one of those two numbers is wrong. The line was appended; go find out which." >&2
fi
echo "indexation-check: appended to metrics/indexation.jsonl (indexed=$IDX_JSON, live=$LIVE/${#URLS[@]})"
