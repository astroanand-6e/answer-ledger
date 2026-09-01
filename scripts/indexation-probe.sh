#!/usr/bin/env bash
# Controlled indexation probe. Cycle 9.
#
# WHY THIS EXISTS. `scripts/indexation-check.sh` needs a number a human types
# after running a `site:` query in a browser. No human is in the daily loop, so
# criterion 3 has stood at `indexed: null` since it was created — and by void
# rule 1 a null on gate day is a void, and a void kills. That makes criterion 3
# the highest kill risk the project has (critic-munger, cycle 9 ruling, C5).
#
# WHY IT IS NOT THE SCRAPER THAT WAS REJECTED. `indexation-check.sh` rejects
# scraping for one specific and correct reason: "a scraper that silently
# returns 0 is worse than no meter, because 0 is a number the gate will
# believe." An anti-bot challenge and a genuinely unindexed site look identical
# — both are an empty result list.
#
# This probe therefore refuses to report a number unless it has first proved,
# in the same session and against the same engine, that the mechanism CAN
# return results. Two controls must both pass:
#
#   CONTROL A (engine works): a `site:` query for a domain that is certainly
#     indexed must return >= 1 result. If it returns 0, the engine is
#     challenging us and every subsequent 0 is meaningless.
#   CONTROL B (operator works): the returned URLs must actually be on the
#     domain asked for. A search tool that ignores `site:` returns plenty of
#     results and none of them on the domain — which would otherwise read as a
#     healthy engine reporting a real 0. (This is not hypothetical: the agent
#     WebSearch tool was tested on 2026-08-31 and ignores `site:` entirely.)
#
# The target query is scoped to the DOMAIN, not to the /answer-ledger path, and
# the path filtering is done here rather than by the engine. Small indexes
# support `site:domain` but not `site:domain/path`, and an engine that silently
# drops the path would otherwise return the domain's pages and be scored as if
# it had honoured the scope. Counting the prefix ourselves is correct under
# both behaviours, and the probe reports the whole-domain count too: the domain
# already hosts an unrelated project, so a non-zero domain count beside a zero
# answer-ledger count is positive proof that the engine can see this host and
# simply has not indexed our pages yet.
#
# Only if A and B both pass is the target count emitted. Otherwise the probe
# exits non-zero, prints why, and logs NOTHING. An unreliable reading is not
# logged as a zero; it is not logged at all.
#
# USAGE
#   bash scripts/indexation-probe.sh            # probe, print result, log nothing
#   bash scripts/indexation-probe.sh --log      # probe, and on success append via
#                                               # indexation-check.sh --indexed N
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ORIGIN_HOST="astroanand-6e.github.io"
# Engine identifiers here MUST match metrics/README.md's admissibility allowlist
# (google, bing, duckduckgo) verbatim. "ddg" is not "duckduckgo" — a probe that
# logged the former would produce a reading no gate query or freshness check
# would ever recognize as admissible, silently reproducing the exact void this
# probe exists to close.
target_for() { case "$1" in mojeek) echo "site:${ORIGIN_HOST} answer ledger" ;; *) echo "site:${ORIGIN_HOST}" ;; esac; }
# Mojeek rejects a bare `site:` with "Site search requires a search query", so its
# query carries keywords. That makes any Mojeek count a LOWER BOUND — it can only
# see pages matching the keywords — which is why a Mojeek reading must never be
# used to fire the day-14 stop rule. An undercount that stops the project is the
# one error direction we cannot take back.
# Control domain per engine: it must be certainly present in THAT engine's index.
# Mojeek runs its own small crawl and does not have every site a major engine has,
# so a control that is fine for DuckDuckGo is not automatically fine for Mojeek.
control_for() { case "$1" in mojeek) echo "site:wikipedia.org postgres" ;; *) echo "site:crunchydata.com" ;; esac; }
control_host() { case "$1" in mojeek) echo "wikipedia\.org" ;; *) echo "crunchydata\.com" ;; esac; }
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
DO_LOG=0
[ "${1:-}" = "--log" ] && DO_LOG=1

# Query one engine. Prints one URL per line on stdout. Empty output = no results
# (which the caller must NOT interpret without the controls).
run_query() {
  local engine="$1" q="$2" url tmp
  tmp="$(mktemp)"
  case "$engine" in
    duckduckgo) url="https://lite.duckduckgo.com/lite/" ;;
    mojeek)     url="https://www.mojeek.com/search" ;;
    *) rm -f "$tmp"; return 2 ;;
  esac
  local code
  code="$(curl -s -A "$UA" -H "Accept: text/html" -H "Accept-Language: en-US,en;q=0.9" \
          --max-time 25 --data-urlencode "q=$q" -G "$url" -o "$tmp" -w "%{http_code}")"
  # 202 from DDG is its anti-bot challenge, not an empty result set.
  if [ "$code" != "200" ]; then rm -f "$tmp"; return 1; fi
  python3 - "$tmp" <<'PY'
import re, sys, html
s = open(sys.argv[1], encoding='utf-8', errors='replace').read()
skip = ('duckduckgo.com', 'mojeek.com', 'w3.org/', 'google.com/')
out = []
for u in re.findall(r'href="(https?://[^"]+)"', s):
    u = html.unescape(u)
    if any(k in u for k in skip):
        continue
    out.append(u.split('#')[0].rstrip('/'))
for u in dict.fromkeys(out):
    print(u)
PY
  rm -f "$tmp"
  return 0
}

count_on_host() { grep -c "^https\?://${ORIGIN_HOST}" 2>/dev/null || true; }

for engine in duckduckgo mojeek; do
  echo "== engine: $engine"

  CONTROL_A="$(control_for "$engine")"; CTL_HOST="$(control_host "$engine")"
  a=""; for attempt in 1 2 3; do
    if a="$(run_query "$engine" "$CONTROL_A")"; then break; fi
    echo "   CONTROL A: non-200 (challenge/ratelimit), attempt $attempt of 3; backing off"
    a=""; sleep $((attempt * 20))
  done
  [ -n "$a" ] || { echo "   CONTROL A: engine returned a non-200 (challenge/ratelimit). Skipping engine."; sleep 4; continue; }
  a_n="$(printf '%s\n' "$a" | grep -c '^https\?://' || true)"
  a_host="$(printf '%s\n' "$a" | grep -c "^https\?://[^/]*${CTL_HOST}" || true)"
  echo "   CONTROL A ($CONTROL_A): $a_n results, $a_host of them on that host"
  if [ "${a_n:-0}" -lt 1 ]; then echo "   FAIL: engine returned zero results for a certainly-indexed domain. Any target 0 is meaningless."; sleep 4; continue; fi
  if [ "${a_host:-0}" -lt 1 ]; then echo "   FAIL: engine ignored the site: operator (results returned, none on the asked-for domain)."; sleep 4; continue; fi
  sleep 4

  TARGET="$(target_for "$engine")"
  t="$(run_query "$engine" "$TARGET")" || { echo "   TARGET: non-200 on the target query. No reading."; sleep 4; continue; }
  t_n="$(printf '%s\n' "$t" | grep -c "^https\?://${ORIGIN_HOST}/answer-ledger" || true)"
  d_n="$(printf '%s\n' "$t" | grep -c "^https\?://${ORIGIN_HOST}" || true)"
  echo "   DOMAIN:  $d_n distinct URLs on ${ORIGIN_HOST} in total"
  echo "   TARGET:  $t_n distinct URLs under ${ORIGIN_HOST}/answer-ledger"
  printf '%s\n' "$t" | grep "^https\?://${ORIGIN_HOST}" | sed 's/^/     /' || true

  echo
  BOUND_NOTE=""
  case "$engine" in mojeek) BOUND_NOTE=" LOWER BOUND: Mojeek requires keywords alongside site:, so this count sees only keyword-matching pages and MUST NOT be used to fire the day-14 stop rule." ;; esac
  echo "READING: indexed=${t_n:-0} engine=$engine (controls A and B passed)${BOUND_NOTE}"
  if [ "$DO_LOG" = "1" ]; then
    bash "$DIR/scripts/indexation-check.sh" --indexed "${t_n:-0}" --engine "$engine" \
      --note "Automated probe, scripts/indexation-probe.sh, engine=${engine}, query=\"${TARGET}\". Controls passed in-session: ${CONTROL_A} returned ${a_n} results, ${a_host} on that host, so the site: operator works and the engine is not challenging. Whole-domain count ${d_n}. A zero here is a reading, not a failure.${BOUND_NOTE}"
  fi
  exit 0
done

echo
echo "NO READING. Every engine failed a control. Nothing was logged, deliberately:"
echo "an unreliable probe must not write a zero the gate will believe."
exit 1
