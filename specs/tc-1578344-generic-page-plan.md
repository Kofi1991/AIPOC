# Generic Page Creation — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578344 | Verify That All Required Specs Is Displayed When Creating A Generic Content Page | Automate with setup | none | Needs a working Admin account on test.registertovote.london; source case is one Gherkin-style block, decomposed into concrete UI steps below |

Drift found:
- TC-1578344 says "Generic Content Page" — the actual Drupal content type is named "Generic page" (/node/add/page, heading "Create Generic page"). Naming mismatch between TestCollab and the app; recommend updating the case title or noting the app's actual label.
- TC-1578344 is written as a single Gherkin block (GIVEN/WHEN/AND/THEN), not discrete numbered steps — decomposed into concrete, testable UI steps below.
- Field-level claims verified live and CONFIRMED accurate: Title field is marked required (accessible name "Title *"), Summary field is marked required ("Summary *"), Body (rich text editor) is present and NOT marked required — matches the case's "title and summary mandatory, body optional" claim exactly.
- Operational risk (not a case defect, but blocks reliable automation): the only working Admin credential found for test.registertovote.london (access@test.com) returned "You are required to setup two-factor authentication ... You have 1 attempt left. After this you will be unable to login." Any spec that logs in with this account risks being locked out on its very next run. Resolve 2FA or provision a dedicated automation admin account before relying on this plan for repeated runs.
- Credential hygiene: do not hardcode the admin username/password in the generated spec. Reference process.env.TC_ADMIN_USER / process.env.TC_ADMIN_PASS (not currently present in .env — add them there, never commit them). The repo's existing tc-1455.spec.js already violates this by hardcoding credentials for a different (prod, www.registertovote.london) account; that account does not work on staging.
- Validation caveat: the full submit-and-verify-success round trip (filling Title/Summary and clicking Save & Close) was not completed live due to an MCP browser tool timeout on that click. The required/optional field states were confirmed directly from the live accessibility tree (a reliable signal in Drupal), but the actual save/redirect behavior in step 7 below is not yet live-verified and should be confirmed during generation.

## Test Scenarios

### 1. Generic Page Creation

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify That All Required Specs Is Displayed When Creating A Generic Content Page

**File:** `tests/verify-that-all-required-specs-is-displayed-when-creating-a-generic-content-page.spec.js`

**Steps:**
  1. Log in as Admin via authHelper's login flow (math-challenge login applies on this environment), using credentials from process.env.TC_ADMIN_USER / process.env.TC_ADMIN_PASS
    - expect: Login succeeds and the site administration toolbar is visible
  2. Navigate to Add content (/node/add)
    - expect: The content-type picker lists 'Generic page' among the options
  3. Click 'Generic page'
    - expect: Navigates to /node/add/page; heading 'Create Generic page' is displayed
  4. Verify the Title field is present and marked required (accessible name 'Title *')
    - expect: Title field is visible and required
  5. Verify the Summary field is present and marked required (accessible name 'Summary *')
    - expect: Summary field is visible and required
  6. Verify the Body field (rich text editor) is present and not marked required
    - expect: Body field is visible with no required indicator
  7. Fill Title with a unique timestamped value and Summary with a unique value; leave Body empty
    - expect: Both fields accept the input
  8. Click 'Save & Close'
    - expect: No validation error blocks save (Body being empty is accepted); the page redirects away from the add form; the new title is visible on the resulting content view/edit page — confirms the User is able to create a Generic Content Page
