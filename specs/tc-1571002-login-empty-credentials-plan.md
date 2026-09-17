# Login With Empty Credentials — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1571002 | Login attempt with empty credentials | Automate | none | TestCollab flags this as already automated (isAutomated: true) but no real spec file exists in the repo — stale flag. Public page, no real authentication happens (empty submission never touches the account), so this is safe despite being on the login page. |

Drift found:
- **The case assumes submitting triggers a NEW error message; it doesn't.** Step 3 expects "An error message is displayed indicating that credentials are required," implying this appears in response to clicking Log in. Verified live: the text "Please enter your username and password." is **already present on the page before any interaction** (a static hint under the form), and clicking Log in with both fields empty produces **no observable change at all** — same URL, same DOM, no new banner, no page reload. The button click is silently blocked (almost certainly HTML5 `required` validation preventing submission). The test should assert the real behavior: URL stays on `/user/login` and that same static text remains visible — not that a new error "appears".

## Test Scenarios

### 1. Login

**Seed:** `tests/seed.spec.ts`

#### 1.1. Login attempt with empty credentials

**File:** `tests/login-attempt-with-empty-credentials.spec.js`

**Steps:**
  1. Navigate to https://test.registertovote.london/user/login
    - expect: Login page is displayed with Username and Password fields, and the 'Please enter your username and password.' hint text is visible
  2. Leave Username and Password empty and click the Log in button
    - expect: No navigation occurs — URL stays on /user/login
    - expect: The 'Please enter your username and password.' text remains visible (see Drift: this is a static hint, not a newly-triggered error)
