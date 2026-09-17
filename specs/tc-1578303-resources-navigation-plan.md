# Resources Navigation — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578303 | Verify Resources dropdown navigation | Automate | none | Public page, no login required. Reuse tests/helpers/navHelper.js's expectNavLinks/getMainNav for the nav link; a new small helper is needed for the Category filter options. |

Drift found:
- TC-1578303 step 1 says "Hover over or click on 'Resources'" as if it opens a dropdown/flyout menu. Verified live: Resources is a plain link in the main navigation to /resources — there is no hover dropdown anywhere on the site's header. Clicking it navigates to a filterable resource-listing page.
- TC-1578303 step 2's subcategory list doesn't match the live app. The listing page exposes a "Category" filter dropdown (not a nav flyout) with options: "- Any -", "Civic and democratic participation", "London Voter Registration Week 2025", "Media and political literacy", "Voter ID", "Voter Registration". There is no "Reports" category option (Reports exists only as a separate resource "Type" facet, not a Category). "Voter ID campaign resources" in the case corresponds to "Voter ID"; "Political and media literacy" corresponds to "Media and political literacy".

## Test Scenarios

### 1. Resources Navigation

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify Resources dropdown navigation

**File:** `tests/verify-resources-dropdown-navigation.spec.js`

**Steps:**
  1. Navigate to https://test.registertovote.london/ and click the 'Resources' link in the main navigation (reuse tests/helpers/navHelper.js's getMainNav pattern to locate it)
    - expect: Browser navigates to /resources and the 'Resources' page heading is visible — there is no hover dropdown; Resources is a direct link
  2. Open the 'Category' filter dropdown on the Resources page
    - expect: The filter options 'Civic and democratic participation', 'London Voter Registration Week 2025', 'Media and political literacy', 'Voter ID', and 'Voter Registration' are all present
