# News Article / Blog Post Creation — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578624 | Verify successful creation of News article / Blog post with all required fields | Automate with setup | tests/smokeTest/verify-successful-creation-of-news-article-blog-post-with-all-required-fields.spec.js | Needs an authenticated admin/editor account; login currently fails intermittently (math-challenge answer-field detection issue in tests/helpers/authHelper.js) |

Drift found:
- **TC-1578624 steps 3 and 6** — the case embeds a literal password twice in its own step text. Hygiene issue: correct in TestCollab to reference credentials indirectly rather than in plain text.
- **Existing spec hygiene issue** (predates this plan; not something this plan introduces) — `tests/smokeTest/verify-successful-creation-of-news-article-blog-post-with-all-required-fields.spec.js` hard-codes the username/password as local constants instead of reading them from environment variables. Per the standing "never put credentials in a plan" rule, this should be moved to `process.env.TC_USER` / `process.env.TC_PASS` (or equivalent) — flagged here for a human to fix in the spec, not silently changed by this plan.
- **Step 4 → step 7 flow** — the case describes solving a math challenge mid-login (anti-bot check). This is the step most often responsible for automated failures: the answer-input field isn't reliably identifiable among the page's other input fields.

## Test Scenarios

### 1. News Article / Blog Post Creation

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify successful creation of News article / Blog post with all required fields

**File:** `tests/smokeTest/verify-successful-creation-of-news-article-blog-post-with-all-required-fields.spec.js`

**Preconditions:** Logged in as an editor/admin account with permission to create News article / Blog post content.

**Steps:**
  1. Navigate to the login page at test.registertovote.london
    - expect: Login page is displayed with Username and Password fields
  2. Enter a valid username in the Username field
    - expect: Username is accepted in the field
  3. Enter the corresponding valid password in the Password field
    - expect: Password is accepted in the field
  4. Click the Log in button
    - expect: Math (anti-bot) question appears
  5. Solve the maths question
    - expect: Answer is inserted into the box
  6. Re-enter the password (form re-prompts after the math challenge)
    - expect: Password is accepted in the field
  7. Click the Log in button
    - expect: User is authenticated and redirected to the dashboard or home page
  8. Navigate to Add content > News article / Blog post
    - expect: Create News article / Blog post form is displayed
  9. Enter a valid title in the Title field
    - expect: Title is accepted in the field
  10. Enter content in the Summary field
    - expect: Summary text is accepted
  11. Click Add media button and upload an image
    - expect: Image is uploaded and displayed in the Image section
  12. Enter body content using the rich text editor
    - expect: Body content is saved with formatting
  13. Click Save & Close button
    - expect: Blog post is created successfully and user is redirected to the content view

**Success criteria:** post is saved, the browser lands on the content view URL, and the new title is visible as the page heading.
**Failure conditions:** validation error on save, the URL still matches `/add|create/`, or login itself fails before content creation is reached.
