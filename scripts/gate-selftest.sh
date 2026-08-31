#!/usr/bin/env bash
# Self-test for the criterion-3 gate query. Cycle 10.
#
# WHY THIS EXISTS. The criterion-3 query in metrics/README.md was engine-blind
# for four cycles: it selected on `.indexed != null` and ignored `.engine`, so
# an inadmissible Mojeek lower-bound 0 would have been read by the gate as a
# real reading and fired the day-14 stop rule. Nobody noticed because nobody
# ever RAN the query against anything but the live file, which had one record.
#
# A gate query is code. Untested code that kills a project on a number is the
# worst kind. These cases pin the behaviour that the Cycle 10 amendment
# (Munger C1-C5) bought, so a future edit that quietly re-breaks it fails here
# instead of on 2026-09-14.
#
# The first version of the amended query, as drafted, was ALSO broken:
#   select(["google","bing","duckduckgo"] | index(.engine))
# Inside the pipe `.` rebinds to the array, so `.engine` is a lookup of the
# string "engine" on an array and jq errors out. It was caught by running it.
# That is the whole argument for this file.
#
# Usage: bash scripts/gate-selftest.sh   (exit 0 = all cases pass)
set -uo pipefail

Q='[ .[] | select(.kind != "outage") | select(.kind != "announcement")
     | select(.at < "2026-10-01") | select(.indexed != null)
     | select(.engine as $e | ["google","bing","duckduckgo"] | index($e) != null) ]
   | (last | .indexed) // "NO ADMISSIBLE READING"'

pass=0; fail=0
case_() {
  local name="$1" want="$2" data="$3" got
  got="$(printf '%s\n' "$data" | jq -s -r "$Q" 2>&1)"
  if [ "$got" = "$want" ]; then
    pass=$((pass+1)); printf '  ok   %-58s -> %s\n' "$name" "$got"
  else
    fail=$((fail+1)); printf '  FAIL %-58s -> got %-24s want %s\n' "$name" "$got" "$want"
  fi
}

echo "criterion-3 gate query self-test"

case_ "empty file is unmeasured, not zero" "NO ADMISSIBLE READING" ''
case_ "mojeek 0 must NOT read as a gate zero" "NO ADMISSIBLE READING" \
  '{"at":"2026-09-05T00:00:00Z","engine":"mojeek","indexed":0}'
case_ "mojeek 22 must NOT pass the gate either" "NO ADMISSIBLE READING" \
  '{"at":"2026-09-05T00:00:00Z","engine":"mojeek","indexed":22}'
case_ "bing reading is admissible" "7" \
  '{"at":"2026-09-10T00:00:00Z","engine":"bing","indexed":7,"bound":"exact"}'
case_ "google is not dropped by a falsy index-0 bug" "21" \
  '{"at":"2026-09-12T00:00:00Z","engine":"google","indexed":21}'
case_ "duckduckgo is admissible" "3" \
  '{"at":"2026-09-12T00:00:00Z","engine":"duckduckgo","indexed":3}'
case_ "a later mojeek line cannot override an earlier bing reading" "7" \
  '{"at":"2026-09-10T00:00:00Z","engine":"bing","indexed":7}
{"at":"2026-09-11T00:00:00Z","engine":"mojeek","indexed":0}'
case_ "null baseline is not a reading" "NO ADMISSIBLE READING" \
  '{"at":"2026-09-02T00:00:00Z","engine":"google","indexed":null}'
case_ "outage records are excluded" "NO ADMISSIBLE READING" \
  '{"at":"2026-09-02T00:00:00Z","kind":"outage","engine":"google","indexed":5}'
case_ "announcement records are excluded" "NO ADMISSIBLE READING" \
  '{"at":"2026-09-02T00:00:00Z","kind":"announcement","engine":"bing"}'
case_ "post-window reading is excluded" "NO ADMISSIBLE READING" \
  '{"at":"2026-10-02T00:00:00Z","engine":"bing","indexed":40}'
case_ "engine field absent is inadmissible" "NO ADMISSIBLE READING" \
  '{"at":"2026-09-02T00:00:00Z","indexed":9}'
# The day-14 stop rule must be able to FIRE. This is the case the project is
# most tempted to break, so it is asserted explicitly.
case_ "day-14 stop rule CAN fire: admissible reading below 5" "2" \
  '{"at":"2026-09-14T00:00:00Z","engine":"bing","indexed":2,"bound":"exact"}'

echo
echo "pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
