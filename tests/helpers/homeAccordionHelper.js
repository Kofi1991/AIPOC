const { expect } = require('@playwright/test');
const { url } = require('./siteConfig');

const HOME_URL = url('/');
const STEP_NAMES = ['Step 1 Register', 'Step 2 Voter ID', 'Step 3 Vote'];

// A snippet of each step's real content, used to confirm the accordion panel
// actually renders — not just that aria-expanded flipped.
const STEP_CONTENT_SNIPPET = {
  'Step 2 Voter ID': 'Voters in England, and thus',
  'Step 3 Vote': 'You can vote:',
};

// Despite the "step" naming, these accordion helpers work for any accordion header on the
// site — they locate it by role + name, e.g. the help sections on the Register to vote page.
function stepButton(page, stepName) {
  return page.getByRole('button', { name: stepName });
}

async function expectStepCollapsed(page, stepName) {
  await expect(stepButton(page, stepName)).not.toHaveAttribute('aria-expanded', 'true');
}

async function expectStepExpanded(page, stepName) {
  await expect(stepButton(page, stepName)).toHaveAttribute('aria-expanded', 'true');
}

// Expand and collapse share the same button — there is no separate collapse control.
async function toggleStep(page, stepName) {
  await stepButton(page, stepName).click();
}

// Verifies the section and all three step buttons are visible and start collapsed.
async function expectAccordionLoaded(page) {
  await expect(page.getByRole('heading', { name: 'Voting in 3 steps' })).toBeVisible();
  for (const stepName of STEP_NAMES) {
    await expect(stepButton(page, stepName)).toBeVisible();
    await expectStepCollapsed(page, stepName);
  }
}

// Toggles a step open and confirms both the expanded state and its real content.
// A page reflow from a neighboring step's expand animation can occasionally
// swallow the click, so the click+verify is retried as a unit rather than once.
async function expandStep(page, stepName) {
  await expect(async () => {
    await toggleStep(page, stepName);
    await expectStepExpanded(page, stepName);
  }).toPass({ timeout: 15000 });
  const snippet = STEP_CONTENT_SNIPPET[stepName];
  if (snippet) {
    await expect(page.getByText(snippet)).toBeVisible();
  }
}

// Toggles an expanded step closed and confirms it collapsed. Same retry rationale as expandStep.
async function collapseStep(page, stepName) {
  await expect(async () => {
    await toggleStep(page, stepName);
    await expectStepCollapsed(page, stepName);
  }).toPass({ timeout: 15000 });
}

module.exports = {
  HOME_URL,
  expectAccordionLoaded,
  expandStep,
  collapseStep,
  expectStepExpanded,
  expectStepCollapsed,
};
