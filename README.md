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
TC_ADMIN_SESSION=    # Written for you by `npm run session` — don't fill in by hand.
                      # Works around the account's single-session login cap
                      # (see "Authenticated tests" below)
TC_INVALID_USER=     # A deliberately fake account, used only to test failed-login
TC_INVALID_PASS=     # behavior — never a real credential

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
even on failure, and exits with the tests' own exit code. It runs on **Chromium only** by
default (plus the Chromium-only `content-admin` login specs); pass `--all-browsers` for
chromium + firefox + webkit, or `--project=<name>` to choose. It also defaults to `--workers=1`, because the login specs share one admin account; pass `--workers=N` to override.

### Authenticated tests

Specs that need a logged-in admin session run in their own `content-admin` Playwright
project (see `AUTH_SPECS` in `playwright.config.js`) — each logs in fresh in an isolated
context and logs out afterwards. The staging account has a single-session limit, so
repeated logins kick each other out. Instead, log in **once a day** and let everything
reuse that session:

```bash
npm run session     # logs in through the real form, saves the session cookie to .env as TC_ADMIN_SESSION
```

With `TC_ADMIN_SESSION` set, `authHelper.login()` injects that cookie instead of using the
form, and `logout()` leaves the server session alone. Run the `content-admin` project
with `--workers=1`. If specs start failing with *"TC_ADMIN_SESSION is not a valid/live
session"*, the session expired — run `npm run session` again. (The Automated Logout
module is set to 2 hours of inactivity for every role, so a session left idle that long
can expire even within the same day.)

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
  refresh-session.js  logs in once and saves the session cookie to .env (`npm run session`)
  check-broken-links.js
.github/agents/       Claude agent definitions — see "Agent design" below
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

1. **[Planner](.github/agents/Planner.agent.md)** fetches case(s) from TestCollab (by
   ID, suite, or filter), validates every step against the live site, and writes a plan
   to `specs/tc-<id>-*-plan.md` — including any drift found between what the case
   claims and what the app actually does. It then stops; it does not generate anything
   itself.
2. **[QA](.github/agents/QA.agent.md)** reviews that plan independently — re-verifying
   a sample of its claims against TestCollab and the live site, not just trusting the
   planner's own wording — and returns either **Approved** or **Changes requested**.
3. **[Engineer](.github/agents/Engineer.agent.md)** turns an *approved* plan into a
   spec in `tests/`, reusing helpers from `tests/helpers/` wherever one already covers
   a step, runs it, and reports pass or fail. Engineer has no TestCollab write access.
4. Once Engineer reports a pass, **QA** — the same agent that approved the plan, not
   Planner or Engineer — tags the corresponding TestCollab case `automated` and appends
   a pointer back to the spec file.

Alongside the pipeline, **[Dr.Git](.github/agents/DrGit.agent.md)** handles all Git work —
grouping changes into logical commits, keeping secrets and run artifacts out of them,
pushing and opening pull requests — and only when asked.

A spec's own header comment (`// spec: specs/tc-<id>-...-plan.md`) is the traceability
link back to its plan and TestCollab case — spec filenames are based on the test title,
not the TC ID.

## Agent design

Each agent in `.github/agents/` is scoped and constrained on purpose, not just prompted
to "write tests":

- **Planner** — never invents a scenario and presents it as a TestCollab case, and
  never silently "fixes" a case to match the app. Where the case and the live site
  disagree, it reports the drift instead of editing it away, so a human decides which
  side is wrong. Every scenario in its output is either traced to a real TC ID or
  explicitly marked `Proposed (not in TestCollab)`.
- **Triage before automating** — each case is classified as Automate, Automate with
  setup, Not worth automating, or Blocked, with a stated reason, rather than blindly
  generating a script for anything it's pointed at.
- **Tool-scoped** — `update_test_case` is never used to paper over drift, and Planner's
  write access is gated behind an explicit user request — it doesn't do the automatic
  post-pass tagging (that's QA's job, see below).
- **QA** is the independent gate between planning and generation — it re-checks a
  sample of the plan's claims itself rather than trusting the planner's own account,
  and can't edit the plan; it can only approve a plan or send specific, itemized
  changes back. A plan doesn't reach Engineer without QA's sign-off. QA is also the
  agent that closes the loop afterward: once Engineer reports a spec passed, QA — not
  Planner or Engineer — is the one that tags the TestCollab case `automated` and
  appends the spec-file pointer, the same independent-verification role just applied at
  the other end of the pipeline.
- **Engineer** turns an approved plan into a spec, reusing existing helpers wherever
  one already covers a step instead of re-deriving locators — and re-checks every TC ID
  against TestCollab one more time first, in case anything changed since QA approved
  it. It has no TestCollab write access at all: it runs the spec and reports pass/fail,
  and QA does the tagging.
- **Dr.Git** is the only agent that runs Git. It stages files by name (never `git add -A`),
  runs `tools/check_secrets.py` before every commit (blocking `.env`, tokens, session cookies
  and any value from `.env` — also enforced by a pre-commit hook and a scrub filter that keeps real credentials in `promptfooconfig.yaml` out of commits while leaving your local copy alone; both installed by `tools/install-git-hooks.sh`), splits work
  into logical commits, never adds AI attribution to commits or PRs, and won't push,
  force-push or hard-reset without an explicit instruction.
- **`playwright-test-healer`** fixes a failing spec without silently loosening its
  assertions.
- **`playwright-test-planner` / `playwright-test-generator`** — the same plan → generate
  discipline, for scenarios with no TestCollab case behind them.

Quality bar every plan is held to: traceable (every scenario ties back to a TC ID or is
marked proposed), honest (deferred cases and unverified steps are stated, not omitted),
executable, and independent (no scenario depends on another's leftovers).
