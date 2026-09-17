# Navigation Menu Links Accessibility

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1571005 | Navigation menu links accessibility | Automate | none (tests/header.spec.js covers the same 6 links under an unrelated test title — not traceable to this TC ID) | Public homepage, no login required. Reuse tests/helpers/navHelper.js's getMainNav for the nav landmark. |

Drift found:
- TC-1571005 step 1 says "Navigate to the login page" and expects the nav menu (Home, How to vote, Our work, Resources, Blog, Contact us) to be shown there. Verified live: there is no such content on a login page — this nav menu is on the homepage (https://test.registertovote.london/). The case appears to have been copy-pasted from a login-flow case; step 1 should read "Navigate to the homepage".
- TC-1571005 step 2 says to click each link "sequentially" and expects each to navigate without errors. Verified live: clicking "How to vote" correctly navigates to /how-to-vote with no login redirect. The existing tests/header.spec.js only asserts nav link href attributes via navHelper.expectNavLinks — it never actually clicks through, so it doesn't fully cover this case's step 2 behavior.
- Two pre-existing console errors fire on every page load (a theme JS "c.forEach is not a function" error and a cookieControl script "Cannot convert undefined or null to object" error). They are unrelated to navigation and reproduce on both the homepage and /how-to-vote, so they're a pre-existing site issue, not a regression from this flow.

## Test Scenarios

### 1. Navigation Menu Links Accessibility

**Seed:** `tests/seed.spec.ts`

#### 1.1. Navigation menu links accessibility

**File:** `tests/navigation-menu-links-accessibility.spec.js`

**Steps:**
  1. Navigate to https://test.registertovote.london/ (reuse tests/helpers/navHelper.js's getMainNav to locate the main navigation landmark)
    - expect: Homepage loads and the main navigation is visible with links: Home, How to vote, Our work, Resources, Blog, Contact us
  2. Click the 'How to vote' link in the main navigation
    - expect: Browser navigates to /how-to-vote and the page loads without a login redirect
  3. Click the 'Our work' link in the main navigation
    - expect: Browser navigates to /our-work and the page loads without a login redirect
  4. Click the 'Resources' link in the main navigation
    - expect: Browser navigates to /resources and the page loads without a login redirect
  5. Click the 'Blog' link in the main navigation
    - expect: Browser navigates to /blogs-and-news and the page loads without a login redirect
  6. Click the 'Contact us' link in the main navigation
    - expect: Browser navigates to /contact-us and the page loads without a login redirect
  7. Click the 'Home' link in the main navigation
    - expect: Browser navigates back to / and the page loads without a login redirect
