# Homepage Footer Branding and Link Columns — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1601860 | Homepage footer - GLA branding, address, and link columns | Automate | tests/footer.spec.js (untracked automation, retrofitted rather than duplicated) | Public homepage footer, no login required. This case's steps 1-11 are already covered almost verbatim by the pre-existing, previously-untracked tests/footer.spec.js via footerHelper.expectFooterComplete + clickEmailLink. Rather than write a near-duplicate spec, this plan retrofits that file: adds the traceability header comment and the one genuinely missing check (mobile layout). |

Validation scope (honesty note): live-verified — the wordmark's real DOM structure (see Drift), the address/email block, and that Column 2 has exactly 6 links with no hidden extras beyond the reference screenshot (case step 8 speculates there might be more; there aren't). Reused the mobile-footer screenshot already taken minutes earlier in this session for TC-1601858 (same page, same 375x812 breakpoint) rather than re-capturing it. NOT live-verified: an exhaustive keyboard Tab sweep through all 14+ links (native `<a href>` elements, inherently tab-reachable, already have real accessible names via footerHelper's existing checks — treated as structurally satisfied per the precedent set on tc-1601826/tc-1601858) and pixel-level focus-indicator styling.

Drift found:
- **The wordmark is not styled/split text.** The case describes "GREATER", "LONDON" (bold), "AUTHORITY" as separately styled text spans. Verified live: it is a single `<img alt="GLA Democracy Hub">` — one image asset that visually depicts that wordmark, not live DOM text. `footerHelper.expectFooterLogoVisible` already asserts the real structure (the image's alt text), so no code change needed — this is purely a case-description correction.
- **Column 2 has exactly 6 links, not more.** The case flags uncertainty ("possibly more links below the area visible in the screenshot"). Verified live: Column 2 contains exactly the 6 named links (BSL and Easy Read resources, Free Voter Authority Certificate, How to vote, Impartiality toolkit, Register to vote anonymously, Voting at a polling station) — no additional ones exist.
- **Out of scope, excluded by precedent**: case step 15 (screenshot/baseline pixel-diff) is not implemented — no visual-regression baseline exists in this repo, same gap noted for tc-1601826 and tc-1601858.

## Helpers to reuse
- `tests/helpers/footerHelper.js` — `expectFooterComplete` (logo + address/email + all 14 column links) and `clickEmailLink` already cover case steps 1-11 exactly.

## New helper addition (small)
Add `expectFooterResponsive(page)` to `footerHelper.js` — resizes to 375x812 and confirms the wordmark, address, and at least one link per column remain visible without overlap (the one case requirement `footer.spec.js` doesn't yet cover).

## Test Scenarios

### 1. Homepage Footer

**Seed:** `tests/seed.spec.ts`

#### 1.1. Homepage footer - GLA branding, address, and link columns

**File:** `tests/footer.spec.js`

**Steps:**
  1. Already covered: navigate to homepage, footerHelper.expectFooterComplete (logo, address, email link, all 3 link columns) and clickEmailLink
    - expect: No changes needed — existing tests/footer.spec.js already satisfies case steps 1-11
  2. Add and call footerHelper.expectFooterResponsive(page): resize to 375x812 and check the branding/address/link-columns block remains visible and usable
    - expect: Wordmark, address, and each column's links remain visible at mobile width without overlap
