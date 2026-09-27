# Paragraphs components functionality — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854) · "Verify Paragraphs components functionality" (BBD DHub Test Plan import)
**Fetched:** 1 case (TC-1578414) · **Planned:** 7 sub-tests (one spec file, one `test()` per pair) · **Deferred:** step 4 (accessibility)
**Seed:** tests/seed.spec.ts
**Content type used:** Landing Page (`/node/add/landing_page`) — the only content type carrying the "Content Sections" (`field_content_sections`) field with all 14 paragraph types available.

## Coverage summary

| TC ID | Title | Verdict | Spec | Notes |
|-------|-------|---------|------|-------|
| 1578414 | Verify Paragraphs components functionality | Automate (split into 7 tests, 2 paragraph types each) | verify-paragraphs-components-functionality | Step 4 (accessibility) not automated — see Drift |

The case's own step 2 asks for "one of each type of Paragraph" added to a single node and checked together — automating all 14 in one node/one test would make failures hard to attribute and the node's Save & Close would time out under 14 components' worth of AJAX. Split into 7 independent tests instead, each creating and cleaning up its own Landing Page node with exactly 2 paragraph types, so a single component's regression only fails one test.

## The 7 pairs

1. Accordion + Text
2. Image / video + Call to action
3. Partners / logo listing paragraph + Embed
4. Dual column block + Documents
5. Multi-card block + Chatbot CTA
6. Latest news and blogs + Newsletter signup
7. Resources menu + Webform

## Drift found (verified live against test.registertovote.london, 2026-09-25)

- **"Resource Listing" is skipped**, per the case's own step 2: "Resource Listing can be skipped as it does not show on FE." It is not one of the 14 paragraph types actually offered in the "Add Paragraph" picker on Landing Page — the case's mention of it does not correspond to a real component name here, so there is nothing to automate or map it to.
- **Multi-card block enforces a minimum of 2 "Card" sub-paragraphs** ("A minimum of 2 Paragraphs of type Card is allowed") — not mentioned in the case. `addMultiCardParagraph` takes an array of ≥2 cards, not one; the pair-5 test adds 2.
- **Paragraphs must be added and filled on the create form itself**, not after Save & Close — `createLandingPage`-style helpers that save immediately are not used here; each test fills Title/Summary directly, adds both paragraphs, then saves once.
- **CTA (Call to action) fields are genuinely optional in the CMS**, as the case notes — the pair-2 test fills them anyway to verify the front-end rendering, matching the case's explicit instruction.
- **Embed** uses the case's supplied YouTube iframe snippet; the field's accessible name is "Embed *" (not an exact "Embed" match).
- **Step 4 (accessibility: hover states, tab order, focus boxes, selected states, colour contrast)** is not automated, same reasoning as every other BBD case this session — the case's own author already spot-checked and waived it ("Nothing new noted in these paras so considering this a pass").
- **Newsletter signup's title renders as an `<h2>`**, not a bare text node — front-end assertions target the heading role.
- Out of scope by standing convention: no mobile-viewport or visual-regression steps.

## Test Scenarios

Every scenario: **Seed** `tests/seed.spec.ts`. Log in as Admin via `authHelper.login`. Each test creates a Landing Page as Draft with a unique timestamped title, adds exactly 2 paragraph types, saves, verifies both render on the FE, then deletes the node in a `finally` block via `contentTypeHelper.deleteQuietly`.
