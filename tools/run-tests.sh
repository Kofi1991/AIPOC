#!/usr/bin/env bash
# Runs Playwright tests, always records the run to reports/run-history.json
# (even on failure), and exits with the tests' own exit code so CI still fails
# correctly. Pass --report to also regenerate and open reports/test-report.html after.
# Pass --jira to re-check each failure and file a Jira bug for ones that still
# reproduce (requires JIRA_* vars in .env — opt-in, not run by default).
# Environment: staging by default. --release targets release.registertovote.london, or set
# TC_BASE_URL yourself for anything else. Production is refused (tests/helpers/siteConfig.js).
# Suites are Playwright tags on each test: --smoke runs the @smoke tests, --regression the
# @regression ones (a test can carry both), and both flags together run either. With neither
# flag everything runs.
# Runs on Chromium only by default (plus the Chromium-only content-admin project for
# the login specs). Pass --project=<name> to pick browsers yourself, or --all-browsers
# for chromium + firefox + webkit.
set -o pipefail

report=0
jira=0
all_browsers=0
has_project=0
has_workers=0
suites=()
args=()
for arg in "$@"; do
  if [ "$arg" = "--report" ]; then
    report=1
  elif [ "$arg" = "--jira" ]; then
    jira=1
  elif [ "$arg" = "--release" ]; then
    export TC_BASE_URL="https://release.registertovote.london"
  elif [ "$arg" = "--smoke" ]; then
    suites+=("@smoke")
  elif [ "$arg" = "--regression" ]; then
    suites+=("@regression")
  elif [ "$arg" = "--all-browsers" ]; then
    all_browsers=1
  else
    case "$arg" in --project|--project=*) has_project=1 ;; --workers|--workers=*) has_workers=1 ;; esac
    args+=("$arg")
  fi
done

if [ "$all_browsers" = "0" ] && [ "$has_project" = "0" ]; then
  args+=(--project=chromium --project=content-admin)
fi

# The login specs all share one admin account (single session, shared autosave drafts), so
# running them in parallel makes them trip over each other: one worker unless told otherwise.
if [ "${#suites[@]}" -gt 0 ]; then
  pattern=$(IFS='|'; echo "${suites[*]}")
  args+=(--grep "$pattern")
fi

if [ "$has_workers" = "0" ]; then
  args+=(--workers=1)
fi

echo "Target environment: ${TC_BASE_URL:-https://test.registertovote.london}"

npx playwright test "${args[@]}"
code=$?

python3 "$(dirname "$0")/record_run_history.py"

if [ "$jira" = "1" ]; then
  set -a && source "$(dirname "$0")/../.env" && set +a
  python3 "$(dirname "$0")/file_jira_bugs.py"
fi

if [ "$report" = "1" ]; then
  python3 "$(dirname "$0")/generate_report.py" && open reports/test-report.html
fi

exit $code
