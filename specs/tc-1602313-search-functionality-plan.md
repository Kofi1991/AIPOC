# Search Functionality — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854)
**Fetched:** 1 case (TC-1602313) · **Planned:** 1 · **Deferred:** 0

## Coverage summary

| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1602313 | Verify search functionality returns relevant results | Automate | — | Public homepage, no login required. Distinct from `tests/smokeTest/search.spec.js` (TC unknown), which tests the header search field's autocomplete dropdown — this case tests direct Enter-key submission instead, a different interaction path through the same field. |

## Drift found

- None — all 3 steps verified live exactly as written. Pressing Enter in the header Search field submits to `/site-search?search=<query>` directly (no separate "search button" click needed — the case's step 2 says "clicking the search button", but there is no visible search button next to the header field; Enter-key submission is the actual mechanism and was used instead).
- Note on relevance: searching "voter registration" returned "Showing 1 - 10 of 192 results found" — a broad, individual-word OR-match rather than an exact-phrase match (192 is a large fraction of the site's ~1455 total indexed items). Still directionally relevant (top results: "London Voter Registration Week", "Voter ID: guidance for Londoners", etc.), so the assertion checks that returned results are non-empty and at least one heading contains a query term, not a strict relevance judgment.
- Empty search submits to `/site-search?search=` and falls back to showing all results ("All results", 1455 found) — handled without error, satisfying step 3.

## Test Scenarios

### 1. Search Functionality

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify search functionality returns relevant results

**File:** `tests/smokeTest/verify-search-functionality-returns-relevant-results.spec.js`

**Steps:**
1. Navigate to the homepage and enter "voter registration" in the header Search field
   - expect: field accepts and displays the typed text
2. Press Enter to submit
   - expect: browser navigates to `/site-search?search=voter+registration`; the page shows a "Search results" heading, a non-zero result count, and at least one result heading/summary relevant to "voter"/"registration"
3. Clear the field and submit an empty search
   - expect: navigates to `/site-search?search=` without a JS error or broken page; falls back to showing "All results"


## Test Scenarios
