#!/usr/bin/env bash
# Traffic Gate meter. Appends one dated JSON line to metrics/traffic.jsonl.
#
# The arithmetic that turns this file into a gate reading is defined in
# metrics/README.md. Do not invent a second definition. If you change a field
# name here, change metrics/README.md in the SAME commit or every reading
# afterwards is void.
#
# WHAT THIS MEASURES (read this before you trust a number):
#   The GitHub repo-traffic API measures views of github.com/<owner>/<repo>.
#   It does NOT measure the GitHub Pages site. See metrics/README.md §"Which
#   website this measures" and docs/devops/cycle8-instrument.md in the parent
#   repo for the decision that makes those two facts consistent.
#
# GitHub's traffic API only keeps a rolling 14-day window: a day you did not
# snapshot is a number that no longer exists. Run this DAILY.
#
# CREDENTIAL (this is the part that broke twice in Cycle 6/8):
#   The traffic endpoints require a token with repository *Administration:
#   read* (classic: `repo`). GitHub Actions' `secrets.GITHUB_TOKEN` CANNOT be
#   granted `administration` — that scope does not exist in a workflow
#   `permissions:` block — so GITHUB_TOKEN gets 403 on every traffic endpoint,
#   forever. Set a repo secret METRICS_TOKEN (fine-grained PAT, this repo only,
#   Administration:read + Issues:read + Contents:write) or run this script
#   locally with `gh auth login`. There is no third option and no workaround.
#
#   bash scripts/traffic-snapshot.sh            # uses default repo below
#   REPO=owner/name bash scripts/traffic-snapshot.sh
#
# EXIT CODES (the workflow depends on these):
#   0  a complete record was appended: every endpoint answered.
#   1  a record was appended but it is DEGRADED (>=1 endpoint failed) or the
#      file's one-record-per-line invariant is broken. A green CI run must not
#      be possible when the meter read nothing. A partial line is evidence;
#      a green check over a partial line is a lie.
set -uo pipefail

REPO="${REPO:-astroanand-6e/answer-ledger}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$DIR/metrics/traffic.jsonl"
HANDLES="$DIR/metrics/team-handles.txt"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
mkdir -p "$DIR/metrics"

fail_line() { # append an evidence line, then exit red
  echo "{\"at\":\"$NOW\",\"repo\":\"$REPO\",\"schema\":2,\"degraded\":true,\"api_errors\":[\"$1\"]}" >> "$OUT"
  echo "traffic-snapshot: FAILED — $1" >&2
  exit 1
}

command -v gh >/dev/null 2>&1 || fail_line "gh not installed"
command -v jq >/dev/null 2>&1 || fail_line "jq not installed"

ERRS=()          # human-readable, ends up in the record as api_errors
ERRF="$(mktemp)"; BODYF="$(mktemp)"
trap 'rm -f "$ERRF" "$BODYF"' EXIT

# api PATH NAME JQ_SHAPE_PREDICATE  -> sets API_BODY to a validated JSON body,
# or to "" on any failure, and appends a human-readable reason to ERRS.
#
# NOT a command substitution, deliberately: `X="$(api ...)"` runs api in a
# SUBSHELL, so every `ERRS+=(...)` inside it is discarded and the record comes
# back claiming `degraded: false` while every number is null. That mistake was
# in the first draft of this rewrite and it is the same class of bug as the one
# it was written to fix.
#
# Why the SHAPE predicate exists and a parse check is not enough: `gh api`
# prints the *error body* to stdout on a 403 — `{"message":"Must have push
# access to repository","status":"403"}` — which is perfectly good JSON and is
# an object. The Cycle 6 script fed that straight into `--argjson referrers`
# and then ran `map(.referrer)` over it: "Cannot index string with string",
# jq exit 5, reported as "api unreachable or jq missing", exit 0, green check.
# That is the whole Cycle 6 failure. So we require the field we actually read.
api() {
  local path="$1" name="$2" shape="$3" rc
  API_BODY=""
  gh api -H "Accept: application/vnd.github+json" "$path" >"$BODYF" 2>"$ERRF"; rc=$?
  if [ "$rc" -ne 0 ]; then
    local why; why="$(tr '\n' ' ' < "$ERRF" | tr -d '"\\' | cut -c1-180)"
    local msg; msg="$(jq -r '.message // empty' <"$BODYF" 2>/dev/null | tr -d '"\\')"
    ERRS+=("$name: gh api exit $rc: ${msg:-${why:-no stderr}}")
    return 0
  fi
  if ! jq -e "$shape" >/dev/null 2>&1 <"$BODYF"; then
    local head; head="$(tr '\n' ' ' <"$BODYF" | tr -d '"\\' | cut -c1-180)"
    ERRS+=("$name: body failed shape check ($shape): ${head:-empty}")
    return 0
  fi
  API_BODY="$(cat "$BODYF")"
}

api "repos/$REPO/traffic/views"             views     'type=="object" and has("count") and has("uniques")'; VIEWS="$API_BODY"
api "repos/$REPO/traffic/clones"            clones    'type=="object" and has("uniques")'; CLONES="$API_BODY"
api "repos/$REPO/traffic/popular/referrers" referrers 'type=="array"'; REFERRERS="$API_BODY"
api "repos/$REPO/traffic/popular/paths"     paths     'type=="array"'; PATHS="$API_BODY"

# Demand-intent metrics. Fetch EVERY issue, not just labelled ones: a stranger
# who clicks "New issue" and types a request in the blank form lands unlabelled,
# and the binding metric is also the one most easily lost. We classify here and
# also publish `unclassified_nonteam` so an unlabelled stranger is visible
# instead of invisible.
ISSUES="$(gh issue list --repo "$REPO" --state all --limit 500 \
            --json number,author,createdAt,title,labels 2>"$ERRF")" || true
if ! printf '%s' "$ISSUES" | jq -e 'type == "array"' >/dev/null 2>&1; then
  ERRS+=("issues: gh issue list failed: $(tr '\n' ' ' < "$ERRF" | tr -d '"' | cut -c1-180)")
  ISSUES=""
fi

# Ruling 4: team-authored requests are inadmissible.
if [ -f "$HANDLES" ]; then
  TEAM="$(grep -v '^[[:space:]]*#' "$HANDLES" | tr -d ' \t\r' | grep -v '^$' \
            | tr 'A-Z' 'a-z' | jq -R . | jq -s -c .)"
else
  ERRS+=("team-handles: metrics/team-handles.txt missing; non-team filter DID NOT RUN")
  TEAM='[]'
fi

jq -c -n \
  --arg at "$NOW" --arg repo "$REPO" \
  --argjson views     "${VIEWS:-null}" \
  --argjson clones    "${CLONES:-null}" \
  --argjson referrers "${REFERRERS:-null}" \
  --argjson paths     "${PATHS:-null}" \
  --argjson issues    "${ISSUES:-null}" \
  --argjson team      "$TEAM" \
  --argjson errors    "$(printf '%s\n' "${ERRS[@]+"${ERRS[@]}"}" | grep -v '^$' | jq -R . | jq -s -c .)" \
  '
   def is_team:
     ( (.author.login // "") | ascii_downcase ) as $l
     | ($l == "") or ($l | endswith("[bot]")) or ((.author.is_bot // false) == true)
       or ($team | index($l) != null);
   def has_label($n): ((.labels // []) | map(.name | ascii_downcase) | index($n) != null);

   ($issues // []) as $iss
   | ($iss | map(select(has_label("category-request")))) as $cat
   | ($iss | map(select(has_label("delist")))) as $del
   | ($iss | map(select(has_label("category-request") or has_label("delist") | not))) as $unc
   | {
     at: $at,
     repo: $repo,
     schema: 2,
     measures: "github.com repository traffic, NOT the github.io Pages site",
     degraded: (($errors | length) > 0),
     api_errors: $errors,

     views_14d:   ($views.count   // null),
     uniques_14d: ($views.uniques // null),
     clones_14d:  ($clones.uniques // null),

     referrers: ( ($referrers // []) | map({referrer, count, uniques}) ),
     external_referrers: ( ($referrers // [])
                  | map(select(.referrer
                        | test("github\\.com|github\\.io|^Google$") | not))
                  | length ),
     top_paths: ( ($paths // []) | map({path, count, uniques}) | .[0:10] ),

     category_requests:         ($cat | length),
     category_requests_nonteam: ($cat | map(select(is_team | not)) | length),
     category_request_authors:  ($cat | map({n: .number, a: (.author.login // null),
                                             team: is_team, at: .createdAt})),
     delist_requests:           ($del | length),
     delist_requests_nonteam:   ($del | map(select(is_team | not)) | length),
     unclassified_nonteam:      ($unc | map(select(is_team | not)) | length),
     team_handles_applied:      ($team | length),

     daily_views: ( ($views.views // []) | map({t: .timestamp, c: .count, u: .uniques}) )
   }' >> "$OUT"
JQ_RC=$?

if [ "$JQ_RC" -ne 0 ]; then
  fail_line "jq exit $JQ_RC building the record; NOTHING was measured"
fi

# Guard the invariant rather than trusting it: one record MUST be one line.
BAD="$(grep -cve '^{.*}$' "$OUT" || true)"
if [ "${BAD:-0}" -gt 0 ]; then
  echo "traffic-snapshot: ERROR — $BAD line(s) in $OUT are not a complete JSON object." >&2
  echo "traffic-snapshot: the gate cannot be read from this file. Fix before trusting any number." >&2
  exit 1
fi

echo "traffic-snapshot: appended to metrics/traffic.jsonl ($(wc -l < "$OUT" | tr -d ' ') records total)"

if [ "${#ERRS[@]}" -gt 0 ]; then
  echo "traffic-snapshot: DEGRADED — the record was written but these endpoints did not answer:" >&2
  for e in "${ERRS[@]}"; do echo "  - $e" >&2; done
  echo "traffic-snapshot: a day measured by nothing is a day that does not exist." >&2
  echo "traffic-snapshot: if this is a 403 on a traffic/* endpoint, the token lacks" >&2
  echo "traffic-snapshot: Administration:read. secrets.GITHUB_TOKEN can never have it." >&2
  echo "traffic-snapshot: set repo secret METRICS_TOKEN. See header of this file." >&2
  exit 1
fi
