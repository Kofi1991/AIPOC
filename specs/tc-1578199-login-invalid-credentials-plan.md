# Login With Invalid Credentials — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578199 | Attempt to login with invalid credentials | Automate | none | TestCollab flags this as already automated (isAutomated: true) but no real spec file exists — stale flag. Uses a fake, non-existent account (Access232@test.com), so it never touches the real admin account — safe despite being on the login page. |

Drift found:
- **The case's step 4 expected result doesn't match the first submission.** The case expects only "Unrecognized username or password. Forgot your password?" to appear after the first Log in click. Verified live: the first submission actually shows **both** "Anti-bot verification failed." and the credentials error together, plus the math-challenge widget appears (same anti-bot pattern already documented for TC-1571001's successful-login case) — it's not a clean single credentials error until *after* the math challenge is solved and the form is resubmitted (matching the case's step 7).
- Real, deterministic terminal state (verified): after answering the math challenge and resubmitting, the error becomes exactly "Unrecognized username or password." with a "Forgot your password?" link, no anti-bot text, no math challenge shown again.

## New helper needed
Extend `tests/helpers/authHelper.js` with `attemptInvalidLogin(page, username, password)` — fills and submits credentials that are expected to fail, retries once through the anti-bot math challenge (same pattern as the existing `login` function), and returns without asserting success (the opposite assumption from `login`).

## Test Scenarios

### 1. Login

**Seed:** `tests/seed.spec.ts`

#### 1.1. Attempt to login with invalid credentials

**File:** `tests/attempt-to-login-with-invalid-credentials.spec.js`

**Steps:**
  1. Navigate to the login page and submit the fake account Access232@test.com / mimrad-0cidCy-kadhirreeeet via authHelper.attemptInvalidLogin
    - expect: First submission shows both 'Anti-bot verification failed.' and 'Unrecognized username or password.' together, plus a math-challenge widget (see Drift)
  2. Solve the math challenge and resubmit the same fake credentials (handled inside attemptInvalidLogin)
    - expect: Final error is exactly 'Unrecognized username or password.' with a working 'Forgot your password?' link to /user/password, no anti-bot text, no math challenge shown
    - expect: URL remains on /user/login — no successful authentication occurs
