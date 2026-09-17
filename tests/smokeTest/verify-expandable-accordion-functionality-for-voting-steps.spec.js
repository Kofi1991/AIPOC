// spec: specs/tc-1601825-voting-steps-accordion-plan.md
// seed: tests/seed.spec.ts

const { test } = require('@playwright/test');
const {
  HOME_URL,
  expectAccordionLoaded,
  expandStep,
  collapseStep,
  expectStepExpanded,
} = require('../helpers/homeAccordionHelper');

test.describe('Homepage', () => {
  test('Verify expandable accordion functionality for voting steps', async ({ page }) => {
    // 1. Navigate to the homepage and locate the 'Voting in 3 steps' section
    await page.goto(HOME_URL);
    await expectAccordionLoaded(page);

    // 2. Click Step 2 'Voter ID' to expand it
    await expandStep(page, 'Step 2 Voter ID');

    // 3. Click Step 3 'Vote' to expand it while Step 2 is still expanded
    await expandStep(page, 'Step 3 Vote');
    await expectStepExpanded(page, 'Step 2 Voter ID');

    // 4. Click the still-expanded Step 2 button again to collapse it
    await collapseStep(page, 'Step 2 Voter ID');
    await expectStepExpanded(page, 'Step 3 Vote');
  });
});
