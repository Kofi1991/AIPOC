# Democracy Hub — Playwright test automation

Playwright end-to-end tests for the GLA Democracy Hub site (`test.registertovote.london`,
staging only — never production), generated from and traced back to test cases in
TestCollab.

## Setup

```bash
npm install
npx playwright install
```

Create a `.env` file in the project root:

```bash
TC_ADMIN_USER=       # Admin login for staging
TC_ADMIN_PASS=
TC_ADMIN_SESSION=    # Optional: an already-authenticated session cookie, to
                      # work around the account's single-session login cap
                      # (see "Authenticated tests" below)

# Optional, only needed for `--jira`:
JIRA_API_URL=
JIRA_EMAIL=
JIRA_API_TOKEN=
JIRA_PROJECT_KEY=
```

## Running tests

```bash
npm test                # run everything
npm run test:report     # run, then regenerate and open test-report.html
npm run test:jira       # run, then file Jira bugs for failures that still reproduce
npm run test:full       # both of the above

npx playwright test tests/smokeTest         # just the smoke suite
npx playwright test --project=chromium      # a single browser
```

`npm test` (via `tools/run-tests.sh`) always records the run to `specs/run-history.json`,
even on failure, and exits with the tests' own exit code.

### Authenticated tests

Specs that need a logged-in admin session run in their own `content-admin` Playwright
project (see `AUTH_SPECS` in `playwright.config.js`) — each logs in fresh in an isolated
context and logs out afterwards. The staging account has a single-session limit, so run
that project with `--workers=1`, or set `TC_ADMIN_SESSION` to reuse one live session
instead of repeatedly logging in and getting kicked out.

## Project structure

```
tests/
  smokeTest/          spec files — one per TestCollab case, named after the case title
  helpers/            reusable page-interaction helpers, shared across specs
specs/
  tc-<id>-*-plan.md   generated automation plans, one per TestCollab case (or group)
  run-history.json    every run's pass/fail counts, feeds the report and burndown chart
tools/
  run-tests.sh        the test runner wrapper (see npm scripts above)
  generate_report.py  builds test-report.html from the latest JUnit run + run-history.json
  render_burndown.py  builds specs/burndown-chart.html (automated vs. remaining over time)
  record_run_history.py
  file_jira_bugs.py   opt-in: files a Jira bug per still-reproducing failure
  check-broken-links.js
.github/agents/       Claude agent definitions for the plan → generate workflow below
```

## Reports

- `test-report.html` — latest run, pass/fail breakdown, and a "Past runs" trend tab.
  Regenerate with `npm run test:report` or `python3 tools/generate_report.py`.
- `specs/burndown-chart.html` — TestCollab cases automated vs. remaining, over time.
  Regenerate with `python3 tools/render_burndown.py`.
- `playwright-report/` — Playwright's own built-in HTML reporter for the most recent run.

## TestCollab-driven workflow

Specs aren't written from scratch — they're generated from TestCollab's manual test
cases and kept traceable back to them:

1. **`playwright-testcollab-planner`** fetches case(s) from TestCollab (by ID, suite, or
   filter), validates every step against the live site, and writes a plan to
   `specs/tc-<id>-*-plan.md` — including any drift found between what the case claims
   and what the app actually does.
2. **`playwright-testcollab-generator`** turns a plan into a spec in `tests/`, reusing
   helpers from `tests/helpers/` wherever one already covers a step.
3. Once a generated spec passes, the corresponding TestCollab case is tagged
   `automated` and its description gets a pointer back to the spec file.

A spec's own header comment (`// spec: specs/tc-<id>-...-plan.md`) is the traceability
link back to its plan and TestCollab case — spec filenames are based on the test title,
not the TC ID.

Other agents in `.github/agents/`: `playwright-test-planner` / `playwright-test-generator`
(the same plan → generate flow, for scenarios with no TestCollab case) and
`playwright-test-healer` (fixes a failing spec).
