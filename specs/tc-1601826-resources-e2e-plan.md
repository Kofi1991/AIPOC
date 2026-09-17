# Resources Page — full end-to-end automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1601826 | Resources page full end-to-end test | Automate | none | Public page, no login required. Case is intentionally ONE combined scenario (per its own description) — kept as one test. Per user decision: TC steps 33-36 (network-failure simulation, 3 screenshot comparisons) are explicitly out of scope and excluded below, not just deferred. |

Validation scope (honesty note): live-verified in the browser this session — page load/breadcrumb/H1/intro/bullets, the header site-search field, the page's own "Search resources" field (normal term, clear, nonsense term/no-results state), the Category filter widget's real interaction pattern, one single-filter selection, and the "British Sign Language" link's real href. NOT live-verified this session (extrapolated or flagged for generator-time confirmation): Language/Type/Format filters (structurally identical Choices.js widgets to Category, same pattern), the combined Category+Format filter's AND/OR semantics, card-detail click+back state, the mobile viewport layout, and the keyboard/focus sweep.

Drift found:
- **Baseline console errors**: every /resources page load already throws 2 console errors unrelated to this feature (a `handleResponsiveFooter` TypeError and a `cookieControl` TypeError in the site's theme/cookie-consent bundles). Submitting the page search adds a 3rd, same bundle, also footer-related. Do not assert zero console errors — assert no *new* error signatures beyond this known baseline.
- **Filters and search are full-page navigations, not AJAX**: every search/filter action performs a normal GET with query-string params (`?search=...&category_theme=...&language=...&field_resource_type=...&field_resource_format=...`), confirmed by URL changes after both search-submit and filter-select. Wait strategy should be `waitForURL`/navigation-based, not network-idle/AJAX polling.
- **Filter widgets are not native `<select>` elements**: Category/Language/Type/Format render as Choices.js widgets (`div[role="listbox"]` with `aria-expanded`), confirmed live — Playwright's `selectOption()` fails with "Element is not a `<select>` element". The real pattern: click the widget to open it (`aria-expanded` flips true), then click the target `option`-role element. Selecting an option auto-submits immediately (full navigation) and the panel closes as a side effect — TC step 19's separate "click again to close" does not apply/is not needed.
- **No-results state has no message**: TC step 16 expects "a clear 'no results found' message". Verified live: there is no message at all — the entire card-grid + pagination block is simply absent from the DOM when a search matches nothing. Search/filter controls remain visible and no console error is added. This is a real UX gap worth flagging to the site team; the test should assert the actual (message-less) empty state, not copy that doesn't exist.
- **"British Sign Language" inline link**: confirmed live — it correctly points to `https://www.registertovote.london/resources?search=&category_theme=All&language=78&field_resource_type=All&field_resource_format=All` (the production domain is intentional; it's the site's real BSL-language-filtered resources destination, not an oversight). The test should assert this exact href/destination rather than a generic "no 404" check.

Out of scope (by explicit user decision, not deferred for later): TC steps 33-36 — simulated network failure and all 3 screenshot/visual-regression comparisons. Not included in the generated test at all.

## Helpers to reuse
- `tests/helpers/navHelper.js` — `expectNavLinks`/`getMainNav` for the 6 main nav links; `openMenuIfPresent` for the mobile nav collapse check.
- `tests/helpers/searchHelper.js` — `typeInSearch`/`clearSearch`/`getSearchInput` for the top-level header "Search" field (id `#edit-search`) only; this is a different control from the page's own "Search resources" field.

## New helper needed
`tests/helpers/resourcesHelper.js` — the page-level "Search resources" field and no-results state; opening/selecting a Choices.js filter widget (parametrized by filter name so Category/Language/Type/Format reuse one function); asserting card-grid contents/count/first-card shape; asserting the combined-filter URL state; the bounded keyboard/focus sweep.

## Test Scenarios

### 1. Resources Page

**Seed:** `tests/seed.spec.ts`

#### 1.1. Resources page full end-to-end test

**File:** `tests/resources-page-full-end-to-end-test.spec.js`

**Steps:**
  1. Navigate to https://test.registertovote.london/resources
    - expect: URL contains /resources and page title reflects the Resources page
    - expect: Breadcrumb reads 'Home / Resources' with a working 'Home' link
    - expect: H1 heading 'Resources' is visible
    - expect: All 6 main nav links (Home, How to vote, Our work, Resources, Blog, Contact us) are visible via navHelper.expectNavLinks
    - expect: Translate control is visible in the header
    - expect: Console error count does not exceed the known baseline of 2 (see Drift)
  2. Read the intro paragraph and the 6-item bullet list beneath it
    - expect: Intro paragraph is visible and non-empty
    - expect: All 6 bullets present: social media toolkits; print materials in community languages; resources for Deaf/disabled Londoners (incl. British Sign Language link); FAQs in English/Easy Read/community languages; annual evaluation reports; research reports
  3. Click the 'British Sign Language' inline link, then go back; click the 'Easy Read' inline link, then go back
    - expect: BSL link navigates to the correct destination: https://www.registertovote.london/resources?search=&category_theme=All&language=78&field_resource_type=All&field_resource_format=All (assert this exact href on the link itself)
    - expect: Easy Read link navigates to /resources/faq-easy-read without a 404
  4. Use searchHelper.typeInSearch to type 'voter ID' into the top-level header Search field, then searchHelper.clearSearch to clear it
    - expect: Field visibly displays 'voter ID'
    - expect: Field is empty after clearing
  5. Type 'voting' into the page's own 'Search resources' field (placeholder-based locator) and press Enter; then clear and resubmit; then search the nonsense term 'zzzznoresults123' and press Enter
    - expect: 'voting' search performs a full navigation to /resources?search=voting&... and narrows the card grid to voting-related results, no card renders literal 'undefined'
    - expect: Clearing and resubmitting returns to the full unfiltered card set
    - expect: The nonsense term returns the real no-results state: the entire card-grid+pagination block is absent from the DOM (no message exists — see Drift), search/filter controls remain visible, no new console errors
  6. Open the Category filter widget (click to open — it's a Choices.js div[role=listbox], not a <select>), select 'Civic and democratic participation'; repeat the identical open-then-click-option pattern for Language, Type, and Format using their real first non-placeholder option
    - expect: Opening sets aria-expanded=true and reveals the real option list
    - expect: Selecting an option auto-submits immediately (full navigation with the corresponding query param, e.g. category_theme=80) and the panel closes as a side effect — no separate close action needed
    - expect: Grid narrows to match the selected filter for each of the 4 filters
  7. With filters cleared, select one Category option and one Format option together
    - expect: URL carries both query params simultaneously
    - expect: Grid reflects the combined filter — confirm at generation time whether the result set matches AND or OR semantics and assert whatever the real behavior is
  8. Navigate back to the plain /resources URL to reset filters
    - expect: All 4 filter widgets show their placeholder labels again (Category/Language/Type/Format)
    - expect: Full default card set returns
  9. Count the visible resource cards (no exact count asserted — content is dynamic); inspect the first card for a non-empty heading, at least one tag/label, and a valid link; click into it; use the browser Back button to return
    - expect: Grid contains 1+ cards
    - expect: First card has non-empty heading, 1+ tag, and an href that isn't '#'
    - expect: Clicking navigates to a real resource page or downloadable file, not a 404
    - expect: Back button returns to the Resources page
  10. Resize the viewport to 375x812 (mobile) and inspect layout using navHelper.openMenuIfPresent for the nav; reset to desktop width
    - expect: No horizontal scrollbar at mobile width
    - expect: Nav collapses to a mobile menu pattern if one exists; search, filters, and card grid remain usable and stack appropriately
  11. Tab through a bounded set of interactive elements from the top of the header downward (nav links, both search fields, the 4 filter widgets, first 3 cards) using the new resourcesHelper keyboard-sweep function
    - expect: Each focused element has a non-empty accessible name
    - expect: Each focused element shows a visible focus indicator (outline or box-shadow not 'none') — this is a bounded mechanical check, not a full manual AA audit
