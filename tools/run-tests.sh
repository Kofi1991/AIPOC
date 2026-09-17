#!/usr/bin/env bash
# Runs Playwright tests, always records the run to test-results/run-history.json
# (even on failure), and exits with the tests' own exit code so CI still fails
# correctly. Pass --report to also regenerate and open test-report.html after.
# Pass --jira to re-check each failure and file a Jira bug for ones that still
# reproduce (requires JIRA_* vars in .env — opt-in, not run by default).
set -o pipefail

report=0
jira=0
args=()
for arg in "$@"; do
  if [ "$arg" = "--report" ]; then
    report=1
  elif [ "$arg" = "--jira" ]; then
    jira=1
  else
    args+=("$arg")
  fi
done

npx playwright test "${args[@]}"
code=$?

python3 "$(dirname "$0")/record_run_history.py"

if [ "$jira" = "1" ]; then
  set -a && source "$(dirname "$0")/../.env" && set +a
  python3 "$(dirname "$0")/file_jira_bugs.py"
fi

if [ "$report" = "1" ]; then
  python3 "$(dirname "$0")/generate_report.py" && open test-report.html
fi

exit $code
