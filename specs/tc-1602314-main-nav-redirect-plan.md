# Main Navigation Links Redirect — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854)
**Fetched:** 1 case (TC-1602314) · **Planned:** 0 (already covered) · **Deferred:** 0

## Coverage summary

| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1602314 | Verify main navigation links redirect to correct pages | **Duplicate — already covered** | `tests/smokeTest/navigation-menu-links-accessibility.spec.js` (traces to TC-1571005) | Writing a new spec would duplicate an already-automated, already-passing test almost exactly |

## Drift found

- **This case duplicates TC-1571005 ("Navigation menu links accessibility"), already automated and passing.** TC-1602314's 5 steps (Home, How to vote, Our work, Resources, Contact us — click + assert redirect URL) are a subset of TC-1571005's existing spec, which already clicks and asserts the URL for all 6 main nav links (Home, How to vote, Our work, Resources, Blog, Contact us) via a data-driven loop over `NAV_LINKS` in `tests/smokeTest/navigation-menu-links-accessibility.spec.js`. Verified live against test.registertovote.london — the existing spec's behavior matches TC-1602314's expected results exactly for every link they share.
- **TC-1602314's own description lists 6 links (…including Blog) but its steps only cover 5 — Blog is missing from the steps.** A case-authoring gap, not app drift. Moot here since the existing spec already covers Blog too.
- **"Submenu options displayed" (steps 3-4) verified as real page content, not a literal dropdown:** clicking "Our work" navigates straight to `/our-work`, a section-landing page listing sub-topic cards (Voter ID campaign, London Voter Registration Week, GLA grants, Impartiality and governance, Civic and democratic participation research). Clicking "Resources" navigates to `/resources`, which has Category/Language/Type/Format filter dropdowns — already exercised in depth by the existing `resources-page-full-end-to-end-test.spec.js` (TC-1601826). Since this content is static and only appears once the URL assertion already confirms correct navigation, no additional assertion was added — asserting it separately would be redundant given the two existing specs.

## Recommendation

Tag TC-1602314 `automated`, pointing to `tests/smokeTest/navigation-menu-links-accessibility.spec.js` as the spec satisfying it (in addition to TC-1571005, which it's already traced to). No new code needed.


## Test Scenarios
