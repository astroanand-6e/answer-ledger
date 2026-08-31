#!/usr/bin/env bash
# IndexNow submission. Announces this site's canonical URLs to the search
# engines that participate in the IndexNow protocol, and appends one dated JSON
# line per endpoint to metrics/indexnow.jsonl.
#
# WHY THIS EXISTS. Until Cycle 10 nothing had ever announced this site to any
# crawler. docs/robots.txt correctly declares our sitemap, but crawlers do not
# read robots.txt out of a subdirectory — they read it from the ORIGIN ROOT,
# and https://astroanand-6e.github.io/robots.txt is a GitHub 404 page because
# the user-site repo is not ours. So our sitemap has never been discoverable,
# and with no inbound links either, a reading of "0 indexed" was measuring a
# corpus nobody had been told about. This script tells them.
#
# WHAT IT CANNOT DO. Google does not participate in IndexNow. This reaches
# Bing, Yandex, Seznam and Naver. It is not a fix for criterion 3 as written
# (">=20 canonical URLs indexed by Google"). See docs/devops/cycle10-indexnow.md.
#
# THE SUBDIRECTORY RULE. Our key file cannot live at the origin root, so we use
# IndexNow "Option 2": key file anywhere + a `keyLocation` field in the payload.
# The spec then scopes the submission — a key at
#   https://host/answer-ledger/<key>.txt
# may only submit URLs beginning https://host/answer-ledger/. This script
# ENFORCES that prefix locally and refuses to send a payload that would be
# rejected with 422, because a rejected batch is worse than no batch: it costs
# reputation with the endpoint and teaches us nothing.
#
# USAGE
#   bash scripts/indexnow-submit.sh --dry-run      # print the payload, send nothing
#   bash scripts/indexnow-submit.sh                # verify key file, then submit
#   bash scripts/indexnow-submit.sh --force        # submit even if recently submitted
#   bash scripts/indexnow-submit.sh --endpoints api.indexnow.org,www.bing.com
#
# IDEMPOTENCE. Re-running is safe. An endpoint that already received this exact
# URL set inside the last $MIN_INTERVAL_HOURS hours is SKIPPED rather than
# re-sent, so a cron or a nervous operator cannot spam an endpoint into a 429.
# A skip is recorded as a `"kind":"skip"` line and is excluded from any count of
# submissions, exactly as `kind:"outage"` is excluded in traffic.jsonl.
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITEMAP_FILE="$DIR/docs/sitemap.xml"
OUT="$DIR/metrics/indexnow.jsonl"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
NOW_EPOCH="$(date -u +%s)"

# Single source of truth is src/config.ts. Read the key out of it rather than
# duplicating the literal, so a rotation there cannot silently desync this file.
KEY="$(sed -n 's/^export const INDEXNOW_KEY = "\([0-9A-Za-z-]*\)";$/\1/p' "$DIR/src/config.ts")"
ORIGIN="$(sed -n 's|^export const CANONICAL_ORIGIN = "\(.*\)";$|\1|p' "$DIR/src/config.ts")"
BASE_PATH="$(sed -n 's|^export const BASE_PATH = "\(.*\)";$|\1|p' "$DIR/src/config.ts")"

DRY=0; FORCE=0; ANNOUNCE=0; MIN_INTERVAL_HOURS="${INDEXNOW_MIN_INTERVAL_HOURS:-6}"
# api.indexnow.org is the shared endpoint: it fans a submission out to every
# participating engine. bing and yandex are addressed directly as well, because
# they are the two that matter most to us and a per-endpoint status code is a
# better diagnostic than one aggregate one. Three requests of ~22 URLs is far
# below any published rate limit.
ENDPOINTS_RAW="${INDEXNOW_ENDPOINTS:-api.indexnow.org,www.bing.com,yandex.com}"

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)   DRY=1; shift ;;
    --announce)  ANNOUNCE=1; shift ;;
    --force)     FORCE=1; shift ;;
    --endpoints) ENDPOINTS_RAW="${2:-}"; shift 2 ;;
    --sitemap)   SITEMAP_FILE="${2:-}"; shift 2 ;;
    -h|--help)   sed -n '2,40p' "$0"; exit 0 ;;
    *) echo "indexnow-submit: unknown argument '$1'" >&2; exit 2 ;;
  esac
done

die() { echo "indexnow-submit: $*" >&2; exit 1; }

[ -n "$KEY" ]    || die "could not read INDEXNOW_KEY from src/config.ts"
[ -n "$ORIGIN" ] || die "could not read CANONICAL_ORIGIN from src/config.ts"
case "$KEY" in
  *[!0-9A-Za-z-]*) die "key '$KEY' contains characters the spec forbids (a-z A-Z 0-9 -)" ;;
esac
[ "${#KEY}" -ge 8 ] && [ "${#KEY}" -le 128 ] || die "key length ${#KEY} is outside the spec's 8-128"

HOST="${ORIGIN#https://}"; HOST="${HOST#http://}"; HOST="${HOST%%/*}"
PREFIX="${ORIGIN}${BASE_PATH}/"
KEY_LOCATION="${ORIGIN}${BASE_PATH}/${KEY}.txt"

[ -f "$SITEMAP_FILE" ] || die "no sitemap at $SITEMAP_FILE — run 'npm run build' first"

# --- URL list, straight out of the sitemap we actually publish -------------
# Unescape the XML entities the generator writes, so we POST the real URL.
URLS="$(tr '\n' ' ' < "$SITEMAP_FILE" \
  | grep -o '<loc>[^<]*</loc>' \
  | sed -e 's|<loc>||' -e 's|</loc>||' \
        -e 's|&amp;|\&|g' -e 's|&lt;|<|g' -e 's|&gt;|>|g' -e 's|&quot;|"|g' -e "s|&#39;|'|g" \
  | sort -u)"
[ -n "$URLS" ] || die "no <loc> entries found in $SITEMAP_FILE"

# --- enforce the Option 2 prefix scope BEFORE we spend a request -----------
BAD="$(printf '%s\n' "$URLS" | grep -v "^$(printf '%s' "$PREFIX" | sed 's/[.[\*^$/]/\\&/g')" || true)"
if [ -n "$BAD" ]; then
  echo "indexnow-submit: these URLs fall outside the key's scope ($PREFIX) and would 422:" >&2
  printf '  %s\n' $BAD >&2
  die "refusing to submit an out-of-scope batch"
fi

URL_COUNT="$(printf '%s\n' "$URLS" | wc -l | tr -d ' ')"
URLS_HASH="$(printf '%s\n' "$URLS" | shasum -a 256 | cut -c1-16)"

# --- payload ---------------------------------------------------------------
json_str() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\t/\\t/g'; }
URL_JSON="$(printf '%s\n' "$URLS" | sed 's/.*/"&"/' | paste -sd, -)"
PAYLOAD="$(printf '{"host":"%s","key":"%s","keyLocation":"%s","urlList":[%s]}' \
  "$HOST" "$KEY" "$KEY_LOCATION" "$URL_JSON")"

echo "indexnow-submit: host=$HOST  urls=$URL_COUNT  set=$URLS_HASH"
echo "indexnow-submit: keyLocation=$KEY_LOCATION"

if [ "$DRY" = 1 ]; then
  echo "--- payload (not sent) ---"
  printf '%s\n' "$PAYLOAD"
  exit 0
fi

# --- PREFLIGHT: the key file must be live, or every endpoint returns 403 ----
echo "indexnow-submit: preflight — fetching $KEY_LOCATION"
KEY_BODY_FILE="$(mktemp)"; trap 'rm -f "$KEY_BODY_FILE"' EXIT
KEY_CODE="$(curl -sS -L --max-time 20 -o "$KEY_BODY_FILE" -w '%{http_code}' "$KEY_LOCATION" || echo 000)"
KEY_BODY="$(tr -d '\r\n' < "$KEY_BODY_FILE")"
if [ "$KEY_CODE" != "200" ]; then
  die "key file returned HTTP $KEY_CODE, not 200. Build, commit and push docs/${KEY}.txt first; submitting now would 403."
fi
if [ "$KEY_BODY" != "$KEY" ]; then
  die "key file body does not equal the key (got '${KEY_BODY:0:80}'). Every endpoint would 403."
fi
echo "indexnow-submit: preflight OK — 200, body matches key"

mkdir -p "$(dirname "$OUT")"; touch "$OUT"

log() { # endpoint code ok note [kindfield]
  printf '{"at":"%s","endpoint":"%s","http_code":%s,"url_count":%s,"ok":%s,"key_location":"%s","host":"%s","url_set":"%s"%s,"note":"%s"}\n' \
    "$NOW" "$(json_str "$1")" "$2" "$URL_COUNT" "$3" "$KEY_LOCATION" "$HOST" "$URLS_HASH" "${5:-}" "$(json_str "$4")" >> "$OUT"
}

# --- has this exact URL set gone to this endpoint recently? ----------------
recently_sent() {
  local ep="$1" last
  last="$(grep -F "\"endpoint\":\"$ep\"" "$OUT" 2>/dev/null \
          | grep -F "\"url_set\":\"$URLS_HASH\"" | grep -F '"ok":true' | tail -1 || true)"
  [ -n "$last" ] || return 1
  local at; at="$(printf '%s' "$last" | sed -n 's/.*"at":"\([^"]*\)".*/\1/p')"
  local then_epoch
  then_epoch="$(date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "$at" +%s 2>/dev/null \
             || date -u -d "$at" +%s 2>/dev/null || echo 0)"
  [ "$then_epoch" -gt 0 ] || return 1
  [ $(( (NOW_EPOCH - then_epoch) / 3600 )) -lt "$MIN_INTERVAL_HOURS" ]
}

EXIT=0; RESULTS=""
IFS=',' read -r -a ENDPOINTS <<< "$ENDPOINTS_RAW"
for ep in "${ENDPOINTS[@]}"; do
  ep="$(printf '%s' "$ep" | tr -d ' ')"
  [ -n "$ep" ] || continue
  url="https://${ep}/indexnow"

  if [ "$FORCE" != 1 ] && recently_sent "$ep"; then
    echo "SKIP  $ep — same $URL_COUNT-URL set accepted within the last ${MIN_INTERVAL_HOURS}h (--force to override)"
    RESULTS="${RESULTS}${RESULTS:+, }${ep}=skipped"
    log "$ep" 0 false "skipped: identical URL set accepted within ${MIN_INTERVAL_HOURS}h; nothing was sent" ',"kind":"skip"'
    continue
  fi

  BODY_FILE="$(mktemp)"
  CODE="$(curl -sS -X POST "$url" \
      -H 'Content-Type: application/json; charset=utf-8' \
      -H 'User-Agent: answer-ledger-indexnow/1.0 (+https://github.com/astroanand-6e/answer-ledger)' \
      --data-binary "$PAYLOAD" --max-time 45 \
      -o "$BODY_FILE" -w '%{http_code}' 2>/dev/null || echo 000)"
  SNIP="$(head -c 200 "$BODY_FILE" | tr -d '\r\n' )"; rm -f "$BODY_FILE"

  case "$CODE" in
    200) OK=true;  NOTE="200 OK — URLs submitted." ;;
    202) OK=true;  NOTE="202 Accepted — URLs received, IndexNow key validation pending." ;;
    400) OK=false; NOTE="400 Bad Request — invalid payload format. Body: $SNIP" ;;
    403) OK=false; NOTE="403 Forbidden — key not valid: file not found, or found but key not in it. Body: $SNIP" ;;
    422) OK=false; NOTE="422 Unprocessable — URLs do not belong to the host, or key does not match the schema. Body: $SNIP" ;;
    429) OK=false; NOTE="429 Too Many Requests — rate limited as potential spam. Back off; do not retry in a loop. Body: $SNIP" ;;
    000) OK=false; NOTE="transport failure — no HTTP response (DNS, TLS or timeout). Nothing was submitted." ;;
    *)   OK=false; NOTE="unexpected HTTP $CODE, treated as failure. Body: $SNIP" ;;
  esac

  RESULTS="${RESULTS}${RESULTS:+, }${ep}=${CODE}"
  [ "$OK" = true ] && echo "OK    $ep -> HTTP $CODE" || { echo "FAIL  $ep -> HTTP $CODE  ($NOTE)" >&2; EXIT=1; }
  log "$ep" "$CODE" "$OK" "$NOTE"
done

echo "indexnow-submit: appended $(printf '%s' "${#ENDPOINTS[@]}") record(s) to metrics/indexnow.jsonl"

# --- C6: record the ANNOUNCEMENT in the criterion-3 ledger -----------------
# Munger condition C6 (Cycle 10) requires that the act of announcing the corpus
# to an admissible engine be logged in metrics/indexation.jsonl. This is NOT a
# reading: `indexed` is null and `kind` is "announcement", which the criterion-3
# gate query excludes explicitly, exactly as it excludes kind:"outage". It
# records that the corpus stopped being invisible, and when.
if [ "$ANNOUNCE" = 1 ]; then
  if [ "$EXIT" != 0 ]; then
    echo "indexnow-submit: NOT logging an announcement — at least one endpoint failed." >&2
  else
    IDX="$DIR/metrics/indexation.jsonl"
    SITEMAP_URL="${ORIGIN}${BASE_PATH}/sitemap.xml"
    ANOTE="IndexNow submission accepted for ${URL_COUNT} sitemap URLs. Per-endpoint HTTP status this run: ${RESULTS}. 200 = URLs submitted and key validated; 202 = received, key validation pending. keyLocation=${KEY_LOCATION}. Satisfies Munger condition C6 branch 2: the sitemap was submitted directly to an admissible engine (bing). Per-endpoint status codes are in metrics/indexnow.jsonl, url_set=${URLS_HASH}. NOT A READING: indexed is null. Google does not participate in IndexNow, so this announces to bing/yandex/seznam/naver only. Origin-root robots.txt (branch 1) remains impossible: astroanand-6e.github.io is a user-site repo we do not own."
    printf '{"at":"%s","kind":"announcement","method":"indexnow","engine":"bing","indexed":null,"sitemap":"%s","urls_in_sitemap":%s,"checked_by":"%s","note":"%s"}\n' \
      "$NOW" "$SITEMAP_URL" "$URL_COUNT" \
      "$(json_str "${INDEXATION_CHECKED_BY:-$(git -C "$DIR" config user.name 2>/dev/null || echo unknown)}")" \
      "$(json_str "$ANOTE")" >> "$IDX"
    echo "indexnow-submit: logged kind=announcement to metrics/indexation.jsonl"
  fi
fi

exit $EXIT
