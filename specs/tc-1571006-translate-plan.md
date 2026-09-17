# Translate Functionality — automation plan

## Application Overview

Source: TestCollab project POC (#18854) · Fetched: 1 case · Planned: 1 · Deferred: 0
Seed: tests/seed.spec.ts

Coverage summary:
| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1571006 | Translate functionality | Automate | none (despite isAutomated=true in TestCollab) | Case's 3 steps are underspecified vs. actual widget interaction |

Drift found:
- TC-1571006 is flagged isAutomated=true / automationStatus=2 in TestCollab, but no tc-1571006 or translate spec exists in this repo (tests/, specs/). Recommend correcting the flag or treating this plan as the first real automation of it.
- TC-1571006 step 2 says "Click on the Translate dropdown" — there is no single dropdown to click. The page has two distinct Translate elements: (1) a header link "Go to language selector" that anchor-jumps to #dhub-translation, and (2) the actual widget in the footer at #dhub-translation containing a "Select Language" combobox and a separate "Translate" button. The real interaction is: select a language in the combobox, then click the "Translate" button — not a single dropdown click.
- TC-1571006 step 3 "Select any language at random" — verified with French (Français): after selecting the language AND clicking the footer "Translate" button, the page title changed from "Log in | Democracy Hub" to "Connexion | Centre de la démocratie", confirming translation. Selecting the language alone does not translate the page; the explicit button click is required.
- 2 console errors were present on page load, unrelated to translation (pre-existing, not investigated further — flag if they recur).

## Test Scenarios

### 1. Translate Functionality

**Seed:** `tests/seed.spec.ts`

#### 1.1. Translate functionality

**File:** `tests/translate-functionality.spec.js`

**Steps:**
  1. Navigate to the login page at https://test.registertovote.london/user/login
    - expect: Login page is displayed with the Translate widget visible in the footer (Select Language combobox and Translate button)
  2. Select a language in the footer 'Select Language' combobox (e.g. Français)
    - expect: The combobox reflects the selected language; page content has not yet changed
  3. Click the 'Translate' button next to the language combobox
    - expect: The page content translates into the selected language, e.g. the page title changes from 'Log in | Democracy Hub' to the translated equivalent ('Connexion | Centre de la démocratie' for French)
