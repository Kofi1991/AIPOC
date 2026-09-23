# Secure User Logout / Auto Logout — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854)
**Fetched:** 1 case (TC-1578381) · **Planned:** 1 (steps 1-4) · **Deferred:** 1 group (steps 5-8, not worth automating)

## Coverage summary

| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578381 | Verify Secure User Logout / Auto logout (steps 1-4) | Automate | — | Manual logout + Automated Logout module settings, all verifiable without waiting |
| 1578381 | Verify Secure User Logout / Auto logout (steps 5-8) | Not worth automating | — | Requires waiting out a real multi-hour/day/week session timeout — impractical for a CI-run test |

## Drift found

- **Major: the case's stated timeout values do not match the live configuration.** TC-1578381 steps 3-4 claim "logout time is set to 4 weeks for admin" and "2 days for Content Admin/Site Admin". Verified live at `/admin/config/people/autologout` (Automated Logout module settings, logged in as Admin): the global timeout AND every per-role override (`authenticated`, `administrator`, `site_admin`, `content_editor`) are uniformly set to **7200 seconds (2 hours)** — none are 4 weeks or 2 days. This is a significant discrepancy someone should resolve: either the case's documented expectation is stale, or the site's actual configuration doesn't match what was intended/approved. The spec asserts the real value (7200s for both administrator and site_admin) and flags this instead of asserting the case's stated (and false) values.
- Steps 5-8 (waiting out the real timeout, then confirming redirect-to-login with no session data) are real, valid checks in principle, but even the smallest role's real timeout (2 hours) is impractical to wait out in an automated run. These are marked "Not worth automating" rather than attempted with a shortened/mocked timeout, since mocking the module's internal timer wouldn't actually be testing "the user is logged out automatically" — it'd be testing a fabricated substitute for it.
- Case step numbering is odd: step 1's Given describes "Admin/Site Admin" generically but only one manual-logout flow is meaningfully different to test (the mechanism is identical regardless of role) — tested once as Admin.

## Test Scenarios

### 1. Secure User Logout / Auto Logout

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify Secure User Logout / Auto logout

**File:** `tests/auth/verify-secure-user-logout-auto-logout.spec.js`

**Steps:**
1. Log in as Admin via `authHelper.login`, then log out via `authHelper.logout`
   - expect: browser is redirected to `/user/login` (or equivalent) with the session cleared
2. Log in as Admin again, navigate to `/admin/config/people/autologout`
   - expect: the "Enable autologout" checkbox is checked (module visible and enabled)
3. On the same settings page, read the global timeout and the `administrator`/`site_admin` role timeout field values
   - expect: real value is 7200 seconds for all of them (see Drift — not the case's claimed 4 weeks/2 days)
4. Log out
   - expect: session cleared


## Test Scenarios
