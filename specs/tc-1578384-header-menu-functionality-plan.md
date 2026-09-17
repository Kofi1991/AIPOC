# Header and Menu Functionality — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854)
**Fetched:** 1 case (TC-1578384) · **Planned:** 1 (steps 1-3, 11) · **Blocked:** 1 group (steps 4-10)

## Coverage summary

| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578384 | Verify Header and Menu functionality (steps 1-3, 11) | Automate | `tests/smokeTest/verify-header-and-main-menu-appear.spec.js` (TC-1578342) covers 1-3 already | Reuses `navHelper.expectHeaderBanner`/`expectLogoNavigatesHome`; adds a new keyboard-focus check for step 11 |
| 1578384 | Verify Header and Menu functionality (steps 4-10: menu CRUD via CMS) | **Blocked** | — | Reproducible page-self-close bug discovered live during validation — see Drift |

## Drift found

- **This case heavily duplicates TC-1578342 ("Verify Header and Main Menu Appear") for steps 1-3.** Same top-banner check, same logo-click-returns-home check. TC-1578342's existing spec already covers this — no new code needed for steps 1-3, just traced to this TC ID too.
- **Same "no GLA logo in header" drift as TC-1578342.** This case's step 1 also expects "1. GLA logo 2. 'No Vote No Voice' logo" in the banner. Re-verified live: still only the "No Vote No Voice" logo exists in the header; the GLA-branded logo is footer-only. Same finding, not re-litigated in the spec.
- **Blocking discovery: this admin flow is genuinely unreliable under automation, confirmed across a full second round of attempts (2026-09-17).** Built real reusable helpers (`tests/helpers/menuHelper.js`: `addMenuLink`, `editMenuLinkTitle`, `setMenuLinkWeight`, `getAddChildHref`, `deleteMenuLink`, plus FE-visibility checks) and validated every individual piece live and working: add/edit reliably passed standalone multiple times; reorder confirmed to actually move an item's real position in the FE nav (via the accessible "Weight for \<item\>" `<select>`, revealed by a "Show row weights" toggle — far more reliable than simulating drag-and-drop); child items confirmed to render as a hover-revealed dropdown under their parent (screenshotted). Add even completed a full add→verify→screenshot→delete round trip cleanly once, live, with evidence sent to the user. But **3 consecutive full end-to-end attempts (add→edit→reorder→child→delete in one flow) each failed differently, always past the reorder step**: (1) the page silently closed itself a few seconds after a save with no dialog/crash event (only a `close` event — consistent with a status-message auto-dismiss handler wrongly calling `window.close()`, invisible to a real user since browsers block self-close on a tab they didn't script-open, but honored by Playwright's automation-controlled Chromium); (2) the *entire browser context* was torn down (`Target.createTarget: browserContextId` error) — plausibly because the one open page self-closed while it was the only page left, so Chromium dropped the whole context; (3) a plain navigation simply hung and timed out on a blank white page. Added a `keepContextAlive` anchor tab (an always-open, never-touched page) specifically to survive failure mode (2) — didn't help, since the failures aren't confined to that mode. This consistent clustering (never in add/edit, always from reorder onward) points to cumulative session/state degradation in the admin theme under repeated navigation within one browser session, not a one-off fluke or a test-code bug. **Conclusion: steps 4-10 are not currently safe to run unattended in CI** — 3/3 full-flow failure despite genuine engineering effort. Recommend the dev team investigate: (a) the theme's status-message dismiss script for a stray `window.close()`, and (b) whatever accumulates across admin-page navigations in one session that makes later steps in a sequence increasingly likely to hang or crash the tab.
- **The "additional actions" dropdown / delete-link overlap bug already documented in `tc-1578349-generic-page-delete-plan.md` (Content list) is a distinct instance of the same admin-theme dropbutton component** — worth checking whether the Menu list page (`/admin/structure/menu/manage/main`) has the identical overlap, once the page-close blocker above is resolved.
- **Real accessibility gap found (adjacent to step 11, not literally in scope):** tabbing through the header nav's expanded mega-menu, 3 sub-items ("Translate", "Reports and research", "BSL and Easy Read") show **no visible focus indicator at all** (`outline: none`, `box-shadow: none`) — a genuine WCAG 2.4.7 (Focus Visible) failure. The case's own step 1 defines "Main menu" as the 6 top-level items only, so the automated check is scoped to those 6 (all 6 do show a real focus style — a yellow/black double box-shadow). The sub-item gap is flagged here for follow-up, not asserted as a failure in this spec, since it's genuinely a different, deeper claim than what the case's wording covers.
- **Reordering, if steps 4-10 are revisited later, should use the accessible "Weight for \<item\>" `<select>` dropdowns** (confirmed present per menu row) rather than simulating drag-and-drop — far more reliable in Playwright.
- **Fixed a real bug in the shared `navHelper.expectHeaderBanner` helper**, exposed by this case's step 2 (check the banner on a non-home page — TC-1578342's existing spec only ever called this on the homepage, which doesn't have the collision). On `/resources`, there are **two separate textboxes whose accessible name computes to the identical string "Search"** — the header's global site search and the Resources page's own filter search. Investigated: their `placeholder` attributes differ ("Search" vs "Search resources"), but both end up with an accessible name of exactly "Search", consistent with a duplicate `id="edit-search"` between the two widgets on the page causing a `<label for="edit-search">` to bind to the wrong field. `exact: true` alone doesn't disambiguate two identical name strings. Fixed by taking `.first()`, since the header's field is reliably first in document order on every page — worth a markup fix on the theme's side (give the two search widgets distinct ids) independent of this workaround.

## Test Scenarios

### 1. Header and Menu Functionality

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify Header and Menu functionality

**File:** `tests/smokeTest/verify-header-and-menu-functionality.spec.js`

**Steps:**
1. Navigate to the homepage, inspect the top banner via `navHelper.expectHeaderBanner`
   - expect: 'No Vote No Voice' logo, main menu (6 links), search box all visible (no GLA logo — see Drift)
2. Navigate to `/resources`, repeat the same banner check
   - expect: same banner content on a non-home page
3. Click the header logo via `navHelper.expectLogoNavigatesHome`
   - expect: browser returns to the homepage
4. Tab to each of the 6 main nav links via `navHelper.expectNavLinksKeyboardFocusable`
   - expect: each receives focus and shows a real visible focus indicator (outline or box-shadow, not `none`)

**Not automated (steps 4-10 in TestCollab):** add/edit/delete/reorder/child-menu-item CRUD via CMS — reusable helpers exist in `tests/helpers/menuHelper.js` and every individual operation is confirmed working live, but the full flow chained together is not reliably automatable right now (see Drift). Worth revisiting if the underlying site-stability issue is resolved.
