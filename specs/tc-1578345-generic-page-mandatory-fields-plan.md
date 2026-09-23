# Generic Content Page — Mandatory Fields — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854)
**Fetched:** 1 case (TC-1578345) · **Planned:** 1 scenario (Admin) · **Deferred:** 1 scenario (SiteAdmin)
**Seed:** `tests/seed.spec.ts`

## Coverage summary

| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578345 | Verify That All Mandatory Fields Within Generic Content Page Function as Expected (Admin step) | Automate | — | Verified live against test.registertovote.london |
| 1578345 | Verify That All Mandatory Fields Within Generic Content Page Function as Expected (SiteAdmin step) | Automate with setup | — | Blocked: no `TC_SITEADMIN_USER`/`TC_SITEADMIN_PASS` in `.env` |

## Drift found

- **Case doesn't specify how "will not be created" is observed.** Live validation showed this is enforced entirely client-side: clicking "Save & Close" with Title/Summary blank triggers the browser's native HTML5 required-field validation (`validationMessage`: "Please fill out this field." on both fields) — the form never submits, so there is no server-side error banner to assert on. The plan below asserts on that native validation state and on the URL staying on the create form.
- **SiteAdmin step is unautomated pending credentials.** Only `TC_ADMIN_USER`/`TC_ADMIN_PASS` exist in `.env`. Since the validation observed is a client-side HTML5 constraint on the form markup (not a server-side/role-based check), it will very likely behave identically for SiteAdmin — but this is **not verified** and is not being asserted as fact. Add `TC_SITEADMIN_USER`/`TC_SITEADMIN_PASS` and re-run the planner against this case to cover it.
- **Also note:** when `TC_ADMIN_SESSION` is set, `authHelper.login()` reuses that cookie regardless of which username/password args are passed — so a SiteAdmin scenario cannot be distinguished from Admin while that env var is set. Either unset it for a SiteAdmin-specific run or extend the helper to key session choice off role.

## Deferred

- SiteAdmin variant of TC-1578345 — see "Drift found" above. Not included in the generated spec.


## Test Scenarios

### 1. Generic Page Validation

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify That All Mandatory Fields Within Generic Content Page Function as Expected

**File:** `tests/cms/generic-page/verify-that-all-mandatory-fields-within-generic-content-page-function-as-expected.spec.js`

**Steps:**
  1. Log in as Admin via authHelper.login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS)
    - expect: The browser is redirected away from /user/login and holds an authenticated Drupal session cookie
  2. Open the Generic page creation form via contentPageHelper.openGenericPageForm(page)
    - expect: The "Create Generic page" heading is visible; Title and Summary fields are visible and empty
  3. Leave the Title and Summary fields blank and click the "Save & Close" button
    - expect: The form does not submit — the URL remains https://test.registertovote.london/node/add/page
    - expect: The Title field's native validationMessage reads "Please fill out this field."
    - expect: The Summary field's native validationMessage reads "Please fill out this field."
    - expect: The Title and Summary fields are still visible on the page (page was not created)
  4. Log out via authHelper.logout(page)
    - expect: The session cookie is cleared
