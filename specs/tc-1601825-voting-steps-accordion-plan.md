# Voting Steps Accordion — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1601825 | Verify expandable accordion functionality for voting steps | Automate | none | Public homepage feature, no login required. Needs one new small helper (see below). |

Drift found:
- **TC-1601825 step 1** — case says "Step 1 expanded by default". Verified live: none of the three steps are expanded on initial page load; all start collapsed. Update the case, or treat this as the corrected baseline expectation.
- **TC-1601825 step 4** — case says "Click the collapse button on an expanded step", implying a distinct collapse control. Verified live: there is no separate collapse button — each step's own header button is a toggle that both expands and collapses it.
- **Not mutually exclusive** (not in the case, but relevant to the assertion strategy) — verified live: expanding one step does not collapse another. Step 2 and Step 3 were both open simultaneously with no interference. Each step's expand/collapse is fully independent, so the test must not assume single-open-at-a-time behavior.
- **Real expand signal** — confirmed via the accessibility tree: an expanded step's button carries `aria-expanded="true"` (renders as `[expanded]`) and a content region with real copy (paragraphs/lists/an external link) appears as a sibling immediately after the button; a collapsed step has neither.

## Helpers to reuse
None of the existing `tests/helpers/*.js` files cover an accordion/toggle pattern.

## New helper needed
`tests/helpers/homeAccordionHelper.js` — navigate-to-homepage-and-locate-section, an `expectStepCollapsed`/`expectStepExpanded` pair keyed by step name (checking `aria-expanded` and content visibility), and a `toggleStep` action (single button click, since expand and collapse share one control).

## Test Scenarios

### 1. Homepage

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify expandable accordion functionality for voting steps

**File:** `tests/verify-expandable-accordion-functionality-for-voting-steps.spec.js`

**Steps:**
  1. Navigate to https://test.registertovote.london/ and locate the 'Voting in 3 steps' section
    - expect: Section heading 'Voting in 3 steps' is visible with three step buttons: 'Step 1 Register', 'Step 2 Voter ID', 'Step 3 Vote'
    - expect: All three steps start collapsed (no aria-expanded=true, no content region visible) — corrects the case's 'Step 1 expanded by default' claim, see Drift
  2. Click the 'Step 2 Voter ID' button to expand it
    - expect: Button now has aria-expanded=true
    - expect: A content region with real Voter ID copy (photo ID requirements, an external 'accepted forms of photo ID' link) becomes visible directly after the button
  3. Click the 'Step 3 Vote' button to expand it while Step 2 is still expanded
    - expect: Step 3 expands (aria-expanded=true, its own content region with voting-method copy and a 'Ways to vote' link becomes visible)
    - expect: Step 2 remains expanded and unaffected — steps are independently toggleable, not mutually exclusive
  4. Click the still-expanded 'Step 2 Voter ID' button again (the same button, not a separate collapse control)
    - expect: Step 2 collapses: aria-expanded is no longer true and its content region is no longer visible
    - expect: Step 3 remains expanded and unaffected
