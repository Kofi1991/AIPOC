# Contact Us Page — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578296 | Verify Contact us page displays correct information | Automate | none | Public page, no login required. Reuse the substring-matching pattern from tests/helpers/footerHelper.js's expectContactInfo for the address (it's not literally in the footer here, but the same DOM concatenation issue applies) |

Drift found:
- TC-1578296 step 2 says "the email link" as if there's one; the page actually has an email link in the main article body (accessible name "(link sends email)", href mailto:democracy@london.gov.uk) that is separate from the footer's own email link (accessible name includes "democracy@london.gov.uk"). Target the article body one specifically to test the page's own content, not the shared footer.
- TC-1578296 step 3's address text is not a single clean string in the DOM — it's concatenated without whitespace between segments ("...City HallKamal Chunchie WayLondon E16 1ZEEmail:..."). Assert each segment (Kamal Chunchie Way, London, E16 1ZE) as a separate toContainText, not one exact string match.
- TC-1578296 step 4 says "enter an invalid email format" but the newsletter form also requires First name and Last name; submitting with only an invalid email present also triggers "First name field is required." and "Last name field is required." errors alongside the email one, plus an anti-bot math challenge if any required field is still empty. To assert the email-format error cleanly, fill First/Last name with valid values first, leave email invalid, then submit — verified live: the error "The email address invalidemail is not valid. Use the format user@example.com." appears as its own list item regardless.

## Test Scenarios

### 1. Contact Us Page

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify Contact us page displays correct information

**File:** `tests/verify-contact-us-page-displays-correct-information.spec.js`

**Steps:**
  1. Navigate to https://test.registertovote.london/contact-us
    - expect: Page loads with an 'h1' heading 'Contact us' and the URL is /contact-us
  2. Verify the email link in the main article body (accessible name '(link sends email)') is visible and has href mailto:democracy@london.gov.uk
    - expect: Email link is visible with the correct mailto href
  3. Verify the physical address for Greater London Authority City Hall is displayed, asserting 'Kamal Chunchie Way', 'London', and 'E16 1ZE' as separate substring checks
    - expect: All three address segments are present in the page content
  4. Fill the newsletter form's First name and Last name fields with valid values, fill 'Your email' with the invalid value 'invalidemail', then click 'Sign up'
    - expect: An error message list item reading "The email address invalidemail is not valid. Use the format user@example.com." is displayed, with no First/Last name required-field errors present
