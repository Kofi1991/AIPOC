# Generic Content Page — Deletion — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854)
**Fetched:** 1 case (TC-1578349) · **Planned:** 1 (Admin) · **Deferred:** 1 (Site Admin)
**Seed:** `tests/seed.spec.ts`

## Coverage summary

| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578349 | Verify User Is Able To Delete Generic Content Page (Admin step) | Automate | — | Verified live against test.registertovote.london |
| 1578349 | Verify User Is Able To Delete Generic Content Page (Site Admin step) | Automate with setup | — | Blocked: no `TC_SITEADMIN_USER`/`TC_SITEADMIN_PASS` in `.env` — same gap as TC-1578345/TC-1578346 |

## Drift found

- **The Delete link is hidden behind a collapsed "additional actions" dropdown** next to the row's Edit button in `/admin/content` — `contentPageHelper.deleteContentItemFromList` opens that toggle (`getByRole('button', { name: /additional actions/i })`) before the Delete link becomes clickable; an initial version without this step passed once by timing luck, then reliably timed out (element present in the DOM but not visible).
- **Real layout defect: the row's always-visible "Edit" button visually overlaps the open dropdown's "Delete" item**, intercepting pointer events on a plain `.click()` (confirmed both elements are independently visible/enabled/stable — Playwright's actionability checks pass on each individually, but they occupy overlapping screen coordinates). This is a genuine UI bug worth a design/CSS fix in the admin content list's dropbutton component, not just a test workaround. **Correction (2026-09-16):** an initial fix using `.click({ force: true })` was itself unsafe — `force: true` skips Playwright's visibility checks but still clicks at the element's screen *coordinates*, so under full-suite load it intermittently landed on the overlapping Edit link instead and navigated to the Edit form rather than opening the Delete dialog (observed live via a real failed run, not theoretical). Replaced with `row.locator('a[href*="/delete?"]').evaluate((el) => el.click())`, which dispatches the click directly on that DOM node regardless of what visually overlaps it — verified stable across 4 consecutive runs after the fix.
- **Delete confirmation dialog's confirm button is labelled "Save & Close", not "Delete".** The row's Delete link (`/node/<id>/delete?destination=/admin/content`) opens an AJAX modal titled "Are you sure you want to delete the content item \<title\>? ... This action cannot be undone." with three buttons: Close, **Save & Close**, Cancel. "Save & Close" is the actual confirm action — it appears to be a generic modal component reused across content actions rather than a dedicated delete-confirm button. Worth flagging to the team as a UX/labelling issue (a user could reasonably expect "Delete" to be the button label), independent of whether it's automated correctly.
- **Site Admin step blocked pending credentials**, same as TC-1578345 and TC-1578346 — see those plans for detail. Also note: while `TC_ADMIN_SESSION` is set, `authHelper.login()` reuses that cookie regardless of which username/password args are passed, so a SiteAdmin scenario can't be distinguished from Admin until either the credentials exist and that helper is extended, or `TC_ADMIN_SESSION` is unset for a SiteAdmin-specific run.
- **Environment note (not code drift):** live validation for this case was blocked for a period by Drupal's single-session cap on the shared Admin account — "the account already has an active session elsewhere" — persisting across multiple retries with waits in between, before eventually clearing. Not something the spec can work around; documented here since it's the second time this session this exact account-contention issue has occurred (previously on TC-1578342).
- **The "has been deleted" success message is not a reliable assertion (found 2026-09-21).** After the session-reuse workaround (`TC_ADMIN_SESSION`) went in, this spec failed once in a full-suite run because the message wasn't visible to it within 5s, although the page was deleted and the message was seen appearing. Most likely cause (inferred, not proven): Drupal stores status messages in the *session*, and all `content-admin` specs now share one session, so whichever tab renders next can consume another test's message — the failure screenshot showed a page from a concurrently running spec in the list and no message. Either way, a transient message is the wrong thing to assert on, so the spec now verifies deletion in the CMS itself (Content list filtered by title, with a positive control beforehand). 7/7 `content-admin` specs passed twice in parallel afterwards.

## Test Scenarios

### 1. Generic Page Deletion

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify User Is Able To Delete Generic Content Page

**File:** `tests/smokeTest/verify-user-is-able-to-delete-generic-content-page.spec.js`

**Steps:**
  1. Log in as Admin via authHelper.login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS)
    - expect: The browser is redirected away from /user/login and holds an authenticated Drupal session cookie
  2. Create a Generic page with a unique timestamped title via contentPageHelper.openGenericPageForm + contentPageHelper.createGenericPage (precondition — the case needs an existing page to delete)
    - expect: Page is created, browser navigates away from /node/add/page
  3. Confirm the page exists in the CMS, using the same lookup step 5 will use: contentPageHelper.expectContentItemInList(page, title)
    - expect: Filtering the Content CMS list by the page's title returns exactly one row (positive control — proves the lookup works, so a later "not found" can't be a lookup that never worked)
  4. Delete that page from the Content CMS list via contentPageHelper.deleteContentItemFromList(page, title)
    - expect: A confirmation dialog appears asking "Are you sure you want to delete the content item <title>?"
    - expect: The dialog's "Save & Close" button submits the deletion and the browser returns to /admin/content
  5. **Verify the page is gone via the CMS** with contentPageHelper.expectContentItemAbsentFromList(page, title)
    - expect: The Content CMS list, filtered by the page's title (filter field echoes the title back), shows zero rows for it
    - note: the "The Generic page <title> has been deleted." message is deliberately *not* asserted — see Drift
  6. Log out via authHelper.logout(page)
    - expect: The session cookie is cleared
