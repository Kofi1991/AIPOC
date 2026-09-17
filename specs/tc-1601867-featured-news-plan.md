# Homepage Featured News Section — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1601867 | Homepage - 'Featured news' section | Automate | none | Public homepage feature, no login required. Needs one new small helper. Case step 14 (screenshot/baseline comparison) excluded — no visual-regression baseline exists in this repo, same as tc-1601826/tc-1601858/tc-1601860. |

Validation scope (honesty note): live-verified — heading, exact card count (currently 2, matching the "max 2" constraint), each card's real structure (image/heading/summary), that card 1 navigates to a real article, and the mobile-width (375x812) layout. NOT live-verified: an exhaustive keyboard Tab sweep (cards are native `<a href>` elements, inherently tab-reachable; treated as structurally satisfied per the precedent set on prior cases) and pixel-level focus-indicator styling. Card 2's click-through was not separately clicked (same link pattern as card 1, already confirmed working) — asserted structurally (real href, not '#') instead, to avoid a redundant live navigation.

Drift found:
- **Each card is ONE link, not two.** Case steps 11-12 describe tabbing through "image/link, then heading link" per card, implying each card has a separate focusable image-link and heading-link. Verified live: each card is a single `<a>` element wrapping the image, heading, and summary together — there is no separate image-only link. The accessible name of that one link is the concatenation of the heading and summary text.
- **Card count is currently exactly 2** (not 1), matching the "never more than 2" constraint the case itself flags as needing product confirmation — recorded as the current, real state.

## New helper needed
`tests/helpers/featuredNewsHelper.js` — get-the-section, assert 1-2 cards each with non-empty image/heading/summary and a real (non-'#') href, click-through-and-back for a given card index, and a mobile-responsive check.

## Test Scenarios

### 1. Homepage Featured News

**Seed:** `tests/seed.spec.ts`

#### 1.1. Homepage - 'Featured news' section

**File:** `tests/featured-news-section.spec.js`

**Steps:**
  1. Navigate to https://test.registertovote.london/ and scroll to the 'Featured news' section
    - expect: 'Featured news' heading (h2) is visible
    - expect: Section shows between 1 and 2 cards, never more — currently 2
  2. Inspect both cards: each has a visible image with non-empty alt text, a non-empty heading, non-empty summary text, and a real link (not '#')
    - expect: Both cards have valid structure per the above
  3. Click the first card (the whole card is a single link — see Drift) and confirm it navigates to a real article, then go back
    - expect: Browser navigates to a real /blogs-and-news/... article, not a 404
    - expect: Back returns to the homepage
  4. Resize the viewport to 375x812 (mobile) and re-check the section
    - expect: Both cards remain visible, images/headings/summaries stay legible, no overlap or cut-off content
