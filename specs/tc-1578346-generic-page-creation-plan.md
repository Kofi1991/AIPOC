# Generic Content Page — Creation — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854)
**Fetched:** 1 case (TC-1578346) · **Planned:** 1 · **Deferred:** 0
**Seed:** `tests/seed.spec.ts`

## Coverage summary

| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578346 | Verify That Users Are Able To Create Generic Content Pages. | Automate | — | Verified live against test.registertovote.london |

## Drift found

- **Step 1 lists "Add Paragraph (Select any of the options)" as a required field alongside Title/Summary/Body** (originally named a specific type, "latest Blog"; the user broadened it in TestCollab mid-session to allow any paragraph type). Live, only Title and Summary carry the required asterisk; Body and the "Content Sections" paragraph builder are optional — the case's wording is imprecise on this point (recommend updating it to separate required vs. optional-but-exercised fields). Per explicit user instruction, the spec includes one anyway: Content Sections → Add Paragraph → "Latest news and blogs" (one valid choice among "any of the options"), via `contentPageHelper.addLatestNewsAndBlogsParagraph(page)`. The component's only sub-field is an optional "Title", and the page saves without error with it attached. Since the case now accepts any type, this remains a faithful (if narrower) implementation — not every other type has been verified to render visibly, so the spec doesn't generalize beyond the one type it exercises.
- **Step 2 originally said "Summary should be displayed"** on the created page's own view — live testing showed the Summary text never renders there (only Title as H1 and Body). The user corrected the case in TestCollab mid-session to "Summary should NOT be displayed," which now matches verified live behavior.
- **Step 3 was updated to also expect the selected Paragraph to appear on view.** Initial exploration wrongly concluded the paragraph rendered nothing (a text search for the literal string "Latest news and blogs" found no match). Rechecking against DOM structure instead of visible text showed it does render — as an actual referenced blog post card, not a section labelled "Latest news and blogs" — under the class `paragraph--type--latest-news-and-blogs`. The spec asserts on that class via `contentPageHelper.expectLatestNewsAndBlogsParagraphVisible(page)`, since there's no stable literal text to assert on (the rendered blog post content will change over time as blog posts are added/removed).


## Test Scenarios

### 1. Generic Page Creation

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify That Users Are Able To Create  Generic Content Pages.

**File:** `tests/smokeTest/verify-that-users-are-able-to-create-generic-content-pages.spec.js`

**Steps:**
  1. Log in as Admin via authHelper.login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS)
    - expect: The browser is redirected away from /user/login and holds an authenticated Drupal session cookie
  2. Open the Generic page creation form via contentPageHelper.openGenericPageForm(page)
    - expect: The "Create Generic page" heading is visible
  3. Fill Title with a unique timestamped value, fill Summary, type text into the Body rich text editor, and add a "Latest news and blogs" paragraph via contentPageHelper.addLatestNewsAndBlogsParagraph(page), then click "Save & Close"
    - expect: The Content Sections field shows the "Latest news and blogs" paragraph was added
    - expect: The page saves without any validation error
    - expect: The browser navigates away from /node/add/page to the new node's own URL
  4. On the resulting page view, check for the Summary text
    - expect: The Summary text is NOT visible anywhere on the page
  5. On the resulting page view, check the page's H1 and the added Paragraph via contentPageHelper.expectLatestNewsAndBlogsParagraphVisible(page)
    - expect: The Title text appears as a level-1 heading (H1) exactly matching the entered title
    - expect: The "Latest news and blogs" paragraph (`.paragraph--type--latest-news-and-blogs`) is visible on the page
  6. Log out via authHelper.logout(page)
    - expect: The session cookie is cleared
