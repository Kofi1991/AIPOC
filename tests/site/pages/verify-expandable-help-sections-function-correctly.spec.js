// case: TC-1602312
// spec: specs/tc-1602308-1602312-how-to-vote-pages-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { collapseStep, expectStepCollapsed, expectStepExpanded } = require('../../helpers/homeAccordionHelper');
const { REGISTER_URL, HELP_SECTIONS, expandHelpSection } = require('../../helpers/registerToVoteHelper');

test.describe('Help sections', { tag: ['@regression'] }, () => {
  test('Verify expandable help sections function correctly', async ({ page }) => {
    await page.goto(REGISTER_URL);
    for (const section of HELP_SECTIONS) {
      await expectStepCollapsed(page, section.name);
    }

    // 1-3. Expand 'Anonymous voter registration', 'Register without using the internet' and
    //      'Register if you have no fixed or permanent address' — sections stay open together
    for (const section of HELP_SECTIONS) {
      await expandHelpSection(page, section);
    }

    // 4. Click an already expanded section — it collapses; the others stay open
    const [first, ...others] = HELP_SECTIONS;
    await collapseStep(page, first.name);
    await expect(page.getByText(first.text)).toBeHidden();
    for (const section of others) {
      await expectStepExpanded(page, section.name);
    }
  });
});
