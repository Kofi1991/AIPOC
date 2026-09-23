# Landing Page — mandatory fields, view on FE, edit, delete — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854) · group "Landing Page" (BBD DHub Test Plan import)
**Fetched:** 4 cases (TC-1578395, 1578396, 1578397, 1578398) · **Planned:** 4 (Admin steps) · **Deferred:** the Site Admin repeat step in each of the 4 cases (no TC_SITEADMIN_USER/TC_SITEADMIN_PASS in .env — same gap as every other content-type plan this session)
**Seed:** tests/seed.spec.ts
**Tags:** area:frontend (42210), role:admin (42211), area:cms (42212), role:site-admin (42213) — carried over from TestCollab, not modified.

## Coverage summary

| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578395 | Verify mandatory fields on Landing Page creation | Automate (Admin steps 1-4) | — | Step 2 says Body is one of the skippable optional fields — the Landing form has no Body field at all (only via a Content Sections paragraph); the step is followed using Hero image + CTA only |
| 1578396 | Verify users can view Landing Page content on FE | Automate | — | Matches live behaviour exactly (unlike TC-1578371 in the earlier plan, which contradicted it) |
| 1578397 | Verify users can edit Landing Pages | Automate (Admin steps 1-5 only) | — | Step 4's "redirected to FE" and step 6's accessibility claims do not hold — see Drift |
| 1578398 | Verify user is able to delete Landing Pages | Automate (Admin steps 1-2 only) | — | Steps 3-4 are the second-node/Site Admin repeat — not automated |

Related but not the same: tests/cms/landing-page/ already has 5 specs from specs/tc-1578356-1578402-content-types-plan.md (TC-1578361/65/69/71/73). Those cover create/mandatory/required-fields/delete/edit with a *different* set of assertions (e.g. the earlier edit spec only renames the title). This plan's cases are the BBD-imported versions with their own step wording and additional accessibility/edit-detail checks, so they get their own specs rather than being merged in.

## Drift found (verified live against test.registertovote.london, 2026-09-23)

- **The Landing form has no Body field**, confirmed again here (already noted in the content-types plan). TC-1578395 step 2 and TC-1578397 step 2 both mention "Body text" as something fillable. The only way to add body-style text is a "Text" paragraph via Content Sections — used for TC-1578397's "Add a Paragraph... Add in Body text", which covers both instructions with the one action.
- **Saving an edit from the content list returns to `/admin/content`, not the FE.** TC-1578397 step 4 expects "User is redirected to FE of new Landing Page" — confirmed live it lands on `/admin/content` instead, same drift already noted for the Homepage/Generic/News-Blog BBD edit cases. The spec follows the app: asserts the `/admin/content` redirect, then opens the node from the list to check the FE content.
- **The CTA link has no visible keyboard-focus indicator** (checked via `outline`/`box-shadow` on `.focus()`) — confirmed live it returns nothing. TC-1578397 step 6 itself already documents this same finding ("Focus box not seen... Would recommend adding in Focus state too... Treating as a pass for now as a change does occur when tabbed onto"), i.e. the case's own author already flagged and waived it. The spec asserts the CTA is keyboard-focusable and clickable, not that it has a focus outline — asserting a focus style that provably doesn't exist would just be a flaky/false check. Hover state and "selected state when clicked" (also part of step 6) are not automated: no durable, non-flaky way to assert a CSS hover/active pseudo-state via Playwright without real mouse simulation, and the case treats this area as already-accepted debt, not a live regression risk.
- **Site Admin steps blocked** in every one of these 4 cases (no `TC_SITEADMIN_USER`/`TC_SITEADMIN_PASS`), and even if credentials existed, `authHelper.login()` reuses the shared `TC_ADMIN_SESSION` cookie regardless of which credentials are passed.
- **Success/status messages are not asserted** (e.g. "The Landing Page ... has been deleted."). They live in the Drupal session, which the content-admin specs share via `TC_ADMIN_SESSION`, so another tab can consume the message. Deletion and edits are verified in the CMS content list and/or the node's own page instead.
- Out of scope by standing convention: no mobile-viewport or visual-regression steps in these four cases.

## Test Scenarios

Every scenario: **Seed** `tests/seed.spec.ts`. Log in as Admin via `authHelper.login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS)`; content is created as Draft with a unique timestamped title and deleted afterwards (`finally` → `contentTypeHelper.deleteQuietly`), so nothing is published on the shared staging site.

### 1. Landing Page (BBD)

#### 1.1 Verify mandatory fields on Landing Page creation (TC-1578395)
**File:** tests/cms/landing-page/verify-mandatory-fields-on-landing-page-creation.spec.js
1. Open the Landing Page create form — Title\* and Summary\* are visible with the required-field asterisk.
2. Fill only the optional fields (Hero image via `pickMediaForField`, CTA URL + Link text), leave Title/Summary blank, click Save & Close — expect: still on `/node/add/landing_page`, Title is `:invalid` with the native "Please fill out/in this field." message (reuse `expectBlankSubmitBlockedByBrowser`).
3. Fill Title and Summary only, click Save & Close — expect: the page saves and the browser lands on the new node's own page (H1 = title).
4. Delete the created page in a `finally` (cleanup).

#### 1.2 Verify users can view Landing Page content on FE (TC-1578396)
**File:** tests/cms/landing-page/verify-users-can-view-landing-page-content-on-fe.spec.js
1. Create a Landing Page with only Title and Summary (`createLandingPage`).
2. On its own page: expect the Title as an H1 (`heading`, level 1) and the Summary text visible.
3. Expect the URL path equals `/` + `slugify(title)`.
4. Delete in a `finally`.

#### 1.3 Verify users can edit Landing Pages (TC-1578397)
**File:** tests/cms/landing-page/verify-users-can-edit-landing-pages.spec.js
1. Create a Landing Page with Title and Summary.
2. Open it for editing from the content list (`contentPageHelper.editContentItemFromList`).
3. Set a Hero image (`pickMediaForField`), fill the CTA URL + Link text, add a "Text" paragraph (`addTextParagraph`) with unique body text, change the Title, Save & Close.
4. Expect the browser lands on `/admin/content` (not the FE — see Drift).
5. Open the edited node from the content list: expect the new Title as H1, the paragraph text visible, the CTA link visible (by its link text), the hero image visible, and the URL path matching the new title's slug.
6. Expect the CTA link can receive keyboard focus (`.focus()` + `toBeFocused()`) — no focus-style assertion (see Drift).
7. Delete in a `finally`.

#### 1.4 Verify user is able to delete Landing Pages (TC-1578398)
**File:** tests/cms/landing-page/verify-user-is-able-to-delete-landing-pages.spec.js
1. Create a Landing Page (precondition).
2. Positive control: `expectContentItemInList`.
3. Delete via the content list dropdown (`deleteContentItemFromList`).
4. `expectContentItemAbsentFromList` — the "has been deleted" message is not asserted (see Drift).

## Test Scenarios

### 1. Landing Page (BBD)

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify mandatory fields on Landing Page creation

**File:** `tests/cms/landing-page/verify-mandatory-fields-on-landing-page-creation.spec.js`

**Steps:**
  1. Log in as Admin and open the Landing Page create form
    - expect: Title * and Summary * are visible, marked required
  2. Fill only Hero image and CTA (URL + Link text), leave Title and Summary blank, click Save & Close
    - expect: Still on /node/add/landing_page
    - expect: Title is :invalid with the native 'Please fill out/in this field.' message
  3. Fill Title and Summary only, click Save & Close
    - expect: The page saves and the browser lands on the new node's own page
    - expect: The H1 equals the title
  4. Delete the page (cleanup, in a finally)
    - expect: The page is removed

#### 1.2. Verify users can view Landing Page content on FE

**File:** `tests/cms/landing-page/verify-users-can-view-landing-page-content-on-fe.spec.js`

**Steps:**
  1. Log in as Admin and create a Landing Page with only Title and Summary
    - expect: The page is created
  2. View the created page
    - expect: The Title appears as an H1
    - expect: The Summary text is visible
    - expect: The URL path equals the slugified title
  3. Delete the page (cleanup, in a finally)
    - expect: The page is removed

#### 1.3. Verify users can edit Landing Pages

**File:** `tests/cms/landing-page/verify-users-can-edit-landing-pages.spec.js`

**Steps:**
  1. Log in as Admin and create a Landing Page with Title and Summary
    - expect: The page is created
  2. Open it for editing from the content list
    - expect: The edit form is displayed
  3. Set a Hero image, fill the CTA URL and Link text, add a Text paragraph with unique body text, change the Title, click Save & Close
    - expect: The browser lands on /admin/content
  4. Open the edited node from the content list
    - expect: The new Title is the H1
    - expect: The paragraph text is visible
    - expect: The CTA link is visible
    - expect: The hero image is visible
    - expect: The URL path matches the new title's slug
  5. Focus the CTA link via the keyboard
    - expect: The CTA link receives focus
  6. Delete the page (cleanup, in a finally)
    - expect: The page is removed

#### 1.4. Verify user is able to delete Landing Pages

**File:** `tests/cms/landing-page/verify-user-is-able-to-delete-landing-pages.spec.js`

**Steps:**
  1. Log in as Admin and create a Landing Page (precondition)
    - expect: The page is created
  2. Confirm it is in the CMS content list (positive control)
    - expect: Exactly one row matches the title
  3. Delete it via the content list dropdown (Edit's dropdown > Delete > Save & Close)
    - expect: A confirmation dialog appears and is submitted
  4. Verify it is gone from the content list
    - expect: Zero rows match the title. The 'has been deleted' message is deliberately not asserted.
