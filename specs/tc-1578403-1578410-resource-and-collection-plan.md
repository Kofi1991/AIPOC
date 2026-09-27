# Resource and Resource Collection — mandatory fields, view on FE, edit, delete — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854) · group "Resource" and "additional content type" (BBD DHub Test Plan import)
**Fetched:** 7 cases (TC-1578403, 1578404, 1578405, 1578406, 1578407, 1578408, 1578410) · **Planned:** 7 (Admin steps) · **Deferred:** the Site Admin repeat step in each case (no TC_SITEADMIN_USER/TC_SITEADMIN_PASS — same gap as every other content-type plan)
**Seed:** tests/seed.spec.ts
**Tags:** area:frontend (42210), role:admin (42211), area:cms (42212), role:site-admin (42213), role:fe-user (42209) — carried over from TestCollab as each case already has them, not modified.

## Coverage summary

| TC ID | Title | Verdict | Spec | Notes |
|-------|-------|---------|------|-------|
| 1578403 | Verify mandatory fields on Resource page creation | Automate (Admin steps 1-4) | verify-mandatory-fields-on-resource-page-creation | |
| 1578404 | Verify users can view Resource content on FE | Automate (partial) | verify-users-can-view-resource-content-on-fe | Step 5 accessibility not automated — see Drift |
| 1578405 | Verify users are able to edit Resource pages | Automate (Admin steps 1-5) | verify-users-are-able-to-edit-resource-pages | Step 4's "redirected to FE" does not hold — see Drift |
| 1578406 | Verify user is able to delete Resource pages | Automate (Admin steps 1-2) | verify-user-is-able-to-delete-resource-pages | |
| 1578407 | Verify mandatory fields on additional content type creation | Automate (Admin steps 1-4) | verify-mandatory-fields-on-additional-content-type-creation | "additional content type" = Resource Collection — see Drift |
| 1578408 | Verify users can view additional content type on FE | Automate (partial) | verify-users-can-view-additional-content-type-on-fe | Step 3 accessibility not automated; step 1's "Title not shown" is wrong — see Drift |
| 1578410 | Verify user is able to delete additional content type | Automate (Admin steps 1-2) | verify-user-is-able-to-delete-additional-content-type | |

Not in this batch: TC-1578409 ("Verify users are able to edit additional content type") is Normal priority, not High — deferred to a later batch, same content type so the pattern here will carry over directly when it's picked up.

## Drift found (verified live against test.registertovote.london, 2026-09-25)

- **"Additional content type" is the Resource Collection content type** (`/node/add/resource_collection`). TC-1578407's own step 2 says "Create a new Resouce Collection page" and step 5 says "Site Admin can create Resource Colection nodes", so the case body is explicit even though its title just says "additional content type". TC-1578408/1578410 inherit the same identification.
- **On Resource Collection, only Title and one "Resources" reference are required.** The "Resources" field is an entity-reference autocomplete (type an existing Resource's title, pick the suggestion) — there must already be a saved Resource for the field to resolve, so every Resource Collection spec creates a throwaway Resource first as a precondition and deletes both afterward.
- **TC-1578408 step 1 says the Title should NOT display on the FE ("This does not include the Title").** Verified live: the Title *is* the page's H1, same as every other content type. Not followed; the spec asserts the Title is shown, matching the app.
- **Resource Collection's front end shows a "Related resources" section** with a card per referenced Resource, linking to that Resource's own page; the browser's Back button returns to the collection. This is what TC-1578408 step 1's "Resource download" and step 2's link-and-back checks refer to.
- **Saving an edit from the content list returns to `/admin/content`, not the FE** (TC-1578405 step 4) — same drift already recorded for every other content type's BBD edit case.
- **On Resource edit, Thumbnail image and Category are added but genuinely do not render on the FE** — TC-1578405 step 5 says as much ("This is fine for this test") and live verification confirms it: Body, Language and the Resource type/format labels all show; Thumbnail and Category do not. Not asserted.
- **Accessibility steps** (hover/focus/selected-state checks in TC-1578404 step 5 and TC-1578408 step 3) are not automated, same reasoning as every other BBD case this session: the cases' own authors already found and waived the missing focus-box issue ("Focus box not seen... Treating as a pass for now"), so there is no real behaviour left to assert reliably via Playwright without simulating real mouse hover.
- **Site Admin steps blocked** in every one of these 7 cases (no `TC_SITEADMIN_USER`/`TC_SITEADMIN_PASS`).
- **Success/status messages are not asserted** (e.g. "The Resource ... has been deleted.") — they live in the shared Drupal session; outcomes are verified in the CMS content list and/or the node's own page instead.
- Out of scope by standing convention: no mobile-viewport or visual-regression steps.

## Test Scenarios

Every scenario: **Seed** `tests/seed.spec.ts`. Log in as Admin via `authHelper.login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS)`; content is created as Draft with a unique timestamped title and deleted afterwards (`finally` → `contentTypeHelper.deleteQuietly`), so nothing is published on the shared staging site.

### 1. Resource

#### 1.1 Verify mandatory fields on Resource page creation (TC-1578403)
1. Open the Resource create form — Title\* and the "Resource download" group's asterisk are visible.
2. Fill only the optional fields (Thumbnail image, Summary, Body, Language, Category), leave Title and Resource download blank, click Save & Close — expect: Title is `:invalid` natively; with Title filled but Resource download still blank, the server rejects with "Resource download field is required." and stays on the form.
3. Fill Title and Resource download only, click Save & Close — expect: saves, lands on the node's own page, H1 = title.
4. Delete in a `finally`.

#### 1.2 Verify users can view Resource content on FE (TC-1578404)
1. Create a Resource with only Title and Resource download (`createResource`).
2. On its own page: expect the Title as an H1 and a working download link for the attached file.
3. Expect the URL path equals `/resources/` + `slugify(title)`.
4. Delete in a `finally`.

#### 1.3 Verify users are able to edit Resource pages (TC-1578405)
1. Create a Resource with Title and Summary.
2. Open it for editing from the content list.
3. Add a "Documents" paragraph (a component not used by the Resource create spec), set Thumbnail image, Body, Language (Polish), a Category checkbox, Resource type and Resource format, change the Title, Save & Close.
4. Expect the browser lands on `/admin/content`.
5. Open the edited node: expect the new Title as H1, the Body text visible, "Polish" visible, the chosen Resource type and Resource format labels visible, the URL path matching the new title's slug. Thumbnail and Category are not asserted (see Drift).
6. Delete in a `finally`.

#### 1.4 Verify user is able to delete Resource pages (TC-1578406)
1. Create a Resource (precondition).
2. Positive control: `expectContentItemInList`.
3. Delete via the content list dropdown.
4. `expectContentItemAbsentFromList`.

### 2. Resource Collection (TC-1578407's "additional content type")

#### 2.1 Verify mandatory fields on additional content type creation (TC-1578407)
1. Create a throwaway Resource as a precondition (needed for the Resources autocomplete to resolve).
2. Open the Resource Collection create form — Title\* and the Resources field's asterisk are visible.
3. Fill only the optional fields (Thumbnail, Language, Category, Resource type, Resource format), leave Title and Resources blank, click Save & Close — expect: both are `:invalid` natively (browser blocks the submit).
4. Fill Title and the Resources reference only, click Save & Close — expect: saves, lands on the node's own page, H1 = title.
5. Delete both nodes in a `finally`.

#### 2.2 Verify users can view additional content type on FE (TC-1578408)
1. Create a throwaway Resource, then a Resource Collection referencing it.
2. On the collection's page: expect the Title as an H1 (see Drift — the case's "Title not shown" claim does not hold) and a "Related resources" card linking to the referenced Resource.
3. Click the card, expect navigation to the Resource's own page; go back, expect the URL returns to the collection.
4. Delete both nodes in a `finally`.

#### 2.3 Verify user is able to delete additional content type (TC-1578410)
1. Create a throwaway Resource, then a Resource Collection referencing it (precondition).
2. Positive control on the collection.
3. Delete the collection via the content list dropdown.
4. `expectContentItemAbsentFromList` for the collection; delete the throwaway Resource in a `finally`.

## Test Scenarios

### 1. Resource

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify mandatory fields on Resource page creation

**File:** `tests/cms/resource/verify-mandatory-fields-on-resource-page-creation.spec.js`

**Steps:**
  1. Log in as Admin and open the Resource create form
    - expect: Title * and the Resource download group's asterisk are visible
  2. Fill only optional fields, leave Title and Resource download blank, Save & Close
    - expect: Title is :invalid with the native required-field message
  3. Fill Title only, leave Resource download blank, Save & Close
    - expect: Server rejects with 'Resource download field is required.'
    - expect: Still on /node/add/resource
  4. Fill Title and Resource download only, Save & Close
    - expect: Saves and lands on the node's own page
    - expect: H1 equals the title
  5. Delete the page (cleanup, in a finally)
    - expect: The page is removed

#### 1.2. Verify users can view Resource content on FE

**File:** `tests/cms/resource/verify-users-can-view-resource-content-on-fe.spec.js`

**Steps:**
  1. Log in as Admin and create a Resource with only Title and Resource download
    - expect: The page is created
  2. View the created page
    - expect: The Title appears as an H1
    - expect: A download link for the attached file is visible
    - expect: The URL path equals /resources/<slug of title>
  3. Delete the page (cleanup, in a finally)
    - expect: The page is removed

#### 1.3. Verify users are able to edit Resource pages

**File:** `tests/cms/resource/verify-users-are-able-to-edit-resource-pages.spec.js`

**Steps:**
  1. Log in as Admin and create a Resource with Title and Summary
    - expect: The page is created
  2. Open it for editing from the content list
    - expect: The edit form is displayed
  3. Add a Documents paragraph, set Thumbnail image, Body, Language, a Category checkbox, Resource type and Resource format, change the Title, Save & Close
    - expect: The browser lands on /admin/content
  4. Open the edited node
    - expect: The new Title is the H1
    - expect: Body text is visible
    - expect: The chosen Language, Resource type and Resource format are visible
    - expect: The URL path matches the new title's slug
  5. Delete the page (cleanup, in a finally)
    - expect: The page is removed

#### 1.4. Verify user is able to delete Resource pages

**File:** `tests/cms/resource/verify-user-is-able-to-delete-resource-pages.spec.js`

**Steps:**
  1. Log in as Admin and create a Resource (precondition)
    - expect: The page is created
  2. Confirm it is in the CMS content list (positive control)
    - expect: Exactly one row matches the title
  3. Delete it via the content list dropdown
    - expect: A confirmation dialog appears and is submitted
  4. Verify it is gone from the content list
    - expect: Zero rows match the title

### 2. Resource Collection

**Seed:** `tests/seed.spec.ts`

#### 2.1. Verify mandatory fields on additional content type creation

**File:** `tests/cms/resource/verify-mandatory-fields-on-additional-content-type-creation.spec.js`

**Steps:**
  1. Log in as Admin, create a throwaway Resource (precondition for the autocomplete)
    - expect: The Resource is created
  2. Open the Resource Collection create form
    - expect: Title * and the Resources field's asterisk are visible
  3. Fill only optional fields, leave Title and Resources blank, Save & Close
    - expect: Both fields are :invalid with the native required-field message
  4. Fill Title and the Resources reference only, Save & Close
    - expect: Saves and lands on the node's own page
    - expect: H1 equals the title
  5. Delete both nodes (cleanup, in a finally)
    - expect: Both are removed

#### 2.2. Verify users can view additional content type on FE

**File:** `tests/cms/resource/verify-users-can-view-additional-content-type-on-fe.spec.js`

**Steps:**
  1. Log in as Admin, create a throwaway Resource, then a Resource Collection referencing it
    - expect: Both are created
  2. View the collection's page
    - expect: The Title appears as an H1
    - expect: A 'Related resources' card links to the referenced Resource
  3. Click the card, then go back
    - expect: Navigates to the Resource's own page
    - expect: Going back returns to the collection's URL
  4. Delete both nodes (cleanup, in a finally)
    - expect: Both are removed

#### 2.3. Verify user is able to delete additional content type

**File:** `tests/cms/resource/verify-user-is-able-to-delete-additional-content-type.spec.js`

**Steps:**
  1. Log in as Admin, create a throwaway Resource, then a Resource Collection referencing it (precondition)
    - expect: Both are created
  2. Confirm the collection is in the CMS content list (positive control)
    - expect: Exactly one row matches the title
  3. Delete the collection via the content list dropdown
    - expect: A confirmation dialog appears and is submitted
  4. Verify the collection is gone from the content list
    - expect: Zero rows match the title
  5. Delete the throwaway Resource (cleanup, in a finally)
    - expect: It is removed
