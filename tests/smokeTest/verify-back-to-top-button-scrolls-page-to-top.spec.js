// spec: specs/tc-1602308-1602312-how-to-vote-pages-plan.md
// seed: tests/seed.spec.ts
// NOTE: "scrolls smoothly" is a visual property and isn't asserted — the spec checks the page
// ends at the top and the button hides again.

const { test, expect } = require('@playwright/test');
const { backToTopButton, scrollToPageBottom, expectPageScrolledToTop } = require('../helpers/backToTopHelper');
const { REGISTER_URL } = require('../helpers/registerToVoteHelper');

test.describe('Back to top', () => {
  test('Verify Back to top button scrolls page to top', async ({ page }) => {
    await page.goto(REGISTER_URL);
    await expect(backToTopButton(page)).toBeHidden();

    // 1. Scroll down to the bottom of the page
    await scrollToPageBottom(page);
    await expect(backToTopButton(page)).toBeVisible();

    // 2. Click the 'Back to top' button
    await backToTopButton(page).click();
    await expectPageScrolledToTop(page);
    await expect(backToTopButton(page)).toBeHidden();
  });
});
