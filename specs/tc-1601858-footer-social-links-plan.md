# Homepage Footer Social Links — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 (partial) · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1601858 | Homepage footer - 'Connect with us' social media links | Automate | none | Public homepage footer, no login required. Reuses tests/helpers/footerHelper.js's getFooter/expectSocialLinks almost entirely. Case's own step 12 (screenshot/baseline comparison) excluded — no visual-regression baseline exists in this repo, same reasoning as tc-1601826. |

Validation scope (honesty note): live-verified — footer reached without breakage, "Connect with us" heading position, all 5 icons' real hrefs and accessible names (via accessibility tree), the actual visual appearance of all 5 icons (via screenshot — see Drift, this contradicts the case), and the icon row's mobile-width (375x812) layout. NOT live-verified this session: an exhaustive keyboard Tab sweep through all 5 icons in sequence (the icons are native `<a href>` elements, inherently tab-reachable by default, and each already has a confirmed non-empty accessible name — treated as structurally satisfied rather than manually tabbed through one-by-one) and pixel-level focus-indicator styling. Also not verified: the "opens in a new window" claim was checked via the presence of that exact suffix in each link's accessible name (a site-wide Drupal enhancement already seen elsewhere on this site for genuinely external links) rather than by actually completing a click-through to each real external platform, which would be poor test hygiene (leaving the test environment, hitting real third-party sites).

Drift found:
- **The case's own claim about which icons are "active" is wrong.** Step 3's expected result says only Facebook appears active/white while YouTube, WhatsApp, Instagram, and X appear "greyed/inactive," and explicitly flags this as something to confirm with design rather than assume. Verified live via screenshot: **all 5 icons render identically styled** (same circular background, same accent-colour glyph) — none appear visually greyed out or inactive relative to the others. All 5 also have real, distinct hrefs pointing to the organisation's actual social profiles (Facebook, YouTube, WhatsApp, Instagram, X/Twitter) and a proper "<Platform> (opens in a new window)" accessible name. The test asserts the real (all-active) state, not the case's assumed one.
- **Out of scope, excluded by precedent**: case step 12 (screenshot/baseline pixel-diff comparison) is not implemented — no visual-regression baseline exists in this repo yet, same gap noted for tc-1601826's excluded screenshot steps.

## Helpers to reuse
- `tests/helpers/footerHelper.js` — `getFooter` and `expectSocialLinks(page, socialLinks)` cover the heading-adjacent icon-row structure and per-icon name/href checks almost exactly as-is.

## New helper addition (small)
Extend `footerHelper.js` with a `target="_blank"` attribute check per social link (confirming "opens in a new window" is a real new-tab link, not just label text) — a natural addition to the existing `expectSocialLinks`, not a new file.

## Test Scenarios

### 1. Homepage Footer

**Seed:** `tests/seed.spec.ts`

#### 1.1. Homepage footer - 'Connect with us' social media links

**File:** `tests/homepage-footer-connect-with-us-social-media-links.spec.js`

**Steps:**
  1. Navigate to https://test.registertovote.london/ and scroll to the footer
    - expect: Footer is reached without layout breakage
    - expect: 'Connect with us' heading (h2) is visible above the icon row
  2. Inspect all 5 social icons (Facebook, YouTube, WhatsApp, Instagram, X) via footerHelper.expectSocialLinks, extended to also check target=_blank
    - expect: Each icon has a non-empty accessible name ending '(opens in a new window)', a real href to the org's actual profile (Facebook, YouTube, WhatsApp, Instagram, X), and target=_blank
    - expect: All 5 render as equally active/styled — not 4 greyed-out as the case assumes, see Drift
  3. Resize the viewport to 375x812 (mobile) and re-check the icon row
    - expect: Icon row remains visible and usable, does not overlap or get cut off, all 5 icons fit in one row at this width
