# How to vote pages — navigation, breadcrumb, back-to-top, external links, help sections — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854)
**Fetched:** 5 cases (TC-1602308 … TC-1602312) · **Planned:** 5 · **Deferred:** 0
**Seed:** `tests/seed.spec.ts`

All five are public pages — no login, so none of them touch `TC_ADMIN_SESSION` or `AUTH_SPECS`.

## Coverage summary

| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1602308 | Verify submenu navigation for How to vote section | Automate | — | Hover reveals the submenu; only hover is asserted (see Drift) |
| 1602309 | Verify breadcrumb navigation functions correctly | Automate | — | |
| 1602310 | Verify Back to top button scrolls page to top | Automate | — | "Smoothly" is a visual judgement — asserts the end state |
| 1602311 | Verify external links for voter registration open correctly | Automate | — | Asserts href + new-tab target + the tab's destination URL at navigation commit, not the third-party page content |
| 1602312 | Verify expandable help sections function correctly | Automate | — | Reuses `homeAccordionHelper` (generic on button name) |

No existing spec covers any of these (searched `tests/` for breadcrumb / back-to-top / accordion / external-link coverage; only helper functions in `footerHelper`/`resourcesHelper` touch breadcrumbs incidentally).

## Drift found

- **TC-1602311 says "redirected"; the links actually open in a new tab.** All three (`Register to vote now`, `Check if you can register and vote`, `Find out more about voting rights`) have `target="_blank"`. The spec asserts the new tab opens at the right URL rather than a same-tab redirect.
- **TC-1602311 doesn't say which page the links are on.** Verified live: all three are on `/how-to-vote/register-to-vote`.
- **TC-1602311 step 2 ("Electoral Commission eligibility page") gives no URL.** The link's real destination is `https://www.electoralcommission.org.uk/voting-and-elections/who-can-vote`. That site returns 403 to headless browsers (bot detection — seen in the broken-links audit), and it also redirects that href to `/voting-and-elections/who-can-vote-uk-elections`, so the spec asserts the `href` attribute exactly but only requires the new tab to land on a URL starting with the href (a `landsOn` pattern). It checks the destination at navigation *commit* and never depends on the third-party page loading or its status.
- **TC-1602310 step 1: the button doesn't merely "become visible" — it isn't in the DOM until the page has been scrolled** (~100px trigger). Step 2: the scroll animation takes ~1–2s and ends at exactly `scrollY = 0`, after which the button hides again. "Scrolls smoothly" is not asserted (a visual property); the spec asserts it arrives at the top.
- **TC-1602308 says "Hover over or click".** Hover reveals the submenu. Clicking the parent "How to vote" link navigates straight to `/how-to-vote` instead of opening it, so only hover is exercised. The four submenu links are always in the DOM and only *visible* on hover. "Why vote?" links to `/what-are-benefits-voting-and-registering-vote`, not a `/how-to-vote/...` path.
- **TC-1602309 step 1's expected breadcrumb** ("Home / How to vote / Register to vote: guidance for Londoners") matches, but the last item is plain text (the current page), not a link, and the "/" separators are part of the rendered list. The spec checks the three items in order.
- **Accessibility defect found (not in any case): the help-section headers are `<div role="button">` whose `aria-controls` (`accordion-content-0` …) points at an id that does not exist anywhere in the page.** Dangling ARIA reference. The spec asserts `aria-expanded` and the panel's real content instead.
- **TC-1602312 assumes several sections can be open at once — confirmed** (opening three leaves all three expanded; re-clicking the first collapses only it). The page has two further accordions the case doesn't mention ("Register if you are a student living away from your permanent home", "Help in other languages"); left alone rather than invented as cases.

## Test Scenarios

### 1. Main navigation

#### 1.1. Verify submenu navigation for How to vote section
**TC:** 1602308 · **Priority:** Normal · **Tags:** none (cases carry no tags in TestCollab)
**Preconditions:** none (anonymous)
**File:** `tests/site/navigation/verify-submenu-navigation-for-how-to-vote-section.spec.js`

**Steps:**
1. Go to the homepage and hover "How to vote" in the main navigation
   - **Expect:** the submenu shows Register to vote, Voter ID, Ways to vote, Why vote?
2. Click "Voter ID" in the submenu
   - **Expect:** URL is `/how-to-vote/voter-id`
3. Hover "How to vote" again and click "Ways to vote"
   - **Expect:** URL is `/how-to-vote/ways-to-vote`

### 2. Breadcrumb

#### 2.1. Verify breadcrumb navigation functions correctly
**TC:** 1602309 · **Priority:** Normal · **Tags:** none (cases carry no tags in TestCollab)

**Steps:**
1. Go to `/how-to-vote/register-to-vote`
   - **Expect:** the Breadcrumb landmark lists Home, How to vote, Register to vote: guidance for Londoners, in that order
2. Click "Home" in the breadcrumb
   - **Expect:** URL is the homepage
3. Go back to the Register to vote page and click "How to vote" in the breadcrumb
   - **Expect:** URL is `/how-to-vote`

### 3. Back to top

#### 3.1. Verify Back to top button scrolls page to top
**TC:** 1602310 · **Priority:** Low · **Tags:** none (cases carry no tags in TestCollab)

**Steps:**
1. Open `/how-to-vote/register-to-vote` (a long page); confirm the button is not shown, then scroll to the bottom
   - **Expect:** the "Back to top" button is visible
2. Click "Back to top"
   - **Expect:** the page ends at `scrollY = 0` (allow ~2s for the animation) and the button is hidden again

### 4. External links

#### 4.1. Verify external links for voter registration open correctly
**TC:** 1602311 · **Priority:** High · **Tags:** none (cases carry no tags in TestCollab)

**Steps:** on `/how-to-vote/register-to-vote`, for each of the three links —
1. "Register to vote now" → `https://www.gov.uk/register-to-vote`
2. "Check if you can register and vote" → `https://www.electoralcommission.org.uk/voting-and-elections/who-can-vote`
3. "Find out more about voting rights" → `https://www.gov.uk/elections-in-the-uk`
   - **Expect (each):** the link's `href` is that URL and `target` is `_blank`; clicking it opens a new tab whose URL (at navigation commit) is that URL; the new tab is closed afterwards and the original page is unchanged

### 5. Help sections

#### 5.1. Verify expandable help sections function correctly
**TC:** 1602312 · **Priority:** Normal · **Tags:** none (cases carry no tags in TestCollab)

**Steps:** on `/how-to-vote/register-to-vote` (all sections start collapsed) —
1. Click "Anonymous voter registration"
   - **Expect:** `aria-expanded=true` and the panel text "If you are worried about your safety" is visible
2. Click "Register without using the internet"
   - **Expect:** expanded, panel text "You can print a register to vote form" visible
3. Click "Register if you have no fixed or permanent address"
   - **Expect:** expanded, panel text "experiencing homelessness" visible
4. Click "Anonymous voter registration" again
   - **Expect:** it collapses and its panel text is hidden; the other two stay expanded


## Test Scenarios
