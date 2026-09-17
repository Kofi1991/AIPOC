# Header and Main Menu — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 (partial) · Deferred: 1 (partial, same case)
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578342 | Verify Header and Main Menu Appear | Automate (steps 1-3 only) | none | Steps 1-3 are public/no-auth (top banner + logo-click). Steps 4-13 (add/edit/delete/reorder menu items as Site Admin and as Admin) require the same admin account currently locked out ("Contact support to reset your access" — reconfirmed live this session, same account used by tc-1578344). Deferred, not automated here. |

Drift found:
- TC-1578342 steps 4-13 require an authenticated Admin/Site Admin session to test CMS menu management. The project's one available admin account is currently locked out (verified live: login returns "Contact support to reset your access" even with a valid password + correct anti-bot answer). No auth-requiring case can be automated until this is resolved — recommend a dedicated automation account exempt from the site's brute-force lockout policy, or getting this account's access reset.
- The header logo renders as **two separate links sharing the identical accessible name** "No Vote No Voice home page" — a text-only link and a second link wrapping the logo `<img>`, both pointing to `/`. Scope the locator to the visible image-wrapping link (inside `#block-dhub-starterkit-novotenovoice`) to avoid a strict-mode ambiguity; verified live that clicking it navigates to the homepage.
- TC-1578342's own steps 1 and 2 are verbatim duplicates (identical text and expected result) — likely a copy-paste artifact in the case. Treated as one step in this plan; worth cleaning up in TestCollab.
- **No separate "GLA logo" exists in the header banner.** Step 1's expected result lists both a "GLA logo" and a "No Vote No Voice" logo in the top banner. Verified live (full accessibility-tree read of the `banner` region): the header contains only the "No Vote No Voice" logo (as both a text link and an image link) plus the main navigation — no GLA-branded element at all. The only "GLA Democracy Hub" logo on the page lives in the **footer** (`contentinfo`), not the header. The spec asserts only what's actually in the header: the No Vote No Voice logo, main menu, and search — not a header GLA logo.

## Test Scenarios

### 1. Header and Main Menu

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify Header and Main Menu Appear

**File:** `tests/verify-header-and-main-menu-appear.spec.js`

**Steps:**
  1. Navigate to https://test.registertovote.london/ and inspect the top banner
    - expect: 'No Vote No Voice' logo, main menu (6 links via navHelper.expectNavLinks), and the search text/textbox are all visible — no separate GLA logo exists in the header (see Drift)
  2. Navigate to /resources, then click the header logo (scoped to #block-dhub-starterkit-novotenovoice to avoid the duplicate-accessible-name ambiguity)
    - expect: Browser navigates back to the homepage (/)
