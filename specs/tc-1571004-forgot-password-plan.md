# Forgot Password Reset — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1571004 | Forgot password reset with invalid email address | Automate | none | TestCollab flags this as already automated (isAutomated: true) but no real spec file exists — stale flag. Uses a fake email (wearetesting@test.com), so no real account/email is ever touched — safe. |

Drift found:
- **Case has an internal typo, not app drift**: step 4 says to enter "wearetesting@test.com", but step 5's expected-result text refers to a different, inconsistent email "werarre@test.com". Verified live: the real confirmation message correctly echoes back the email actually entered ("wearetesting@test.com") — the app is consistent; the case text itself has the typo.
- **Same anti-bot pattern as the login cases**: the first Submit shows "Anti-bot verification failed." alongside the math-challenge widget (matches step 4's own expectation that an anti-bot question appears, so no correction needed here — just noting the same site-wide pattern already documented for TC-1571001/TC-1578199).
- Otherwise this case matched the live app closely — no other drift.

## New helper needed
`tests/helpers/passwordResetHelper.js` — navigate to /user/password, assert the reset-form copy (step 3), submit an email through the anti-bot math challenge (same retry pattern as `authHelper.attemptInvalidLogin`), and assert the resulting homepage status message echoes the submitted email.

## Test Scenarios

### 1. Password Reset

**Seed:** `tests/seed.spec.ts`

#### 1.1. Forgot password reset with invalid email address

**File:** `tests/forgot-password-reset-with-invalid-email-address.spec.js`

**Steps:**
  1. Navigate to https://test.registertovote.london/user/password (same destination as the login page's Forgot password link)
    - expect: 'Reset your password' heading is visible
    - expect: 'Username or email address' field, the 'Password reset instructions will be sent to your registered email address.' text, and a Submit button are all visible
  2. Enter the fake email wearetesting@test.com and click Submit; solve the resulting anti-bot math challenge and submit again
    - expect: Browser lands on the homepage (not /user/password)
    - expect: A status message reads: 'If wearetesting@test.com is a valid account, an email will be sent with instructions to reset your password.'
