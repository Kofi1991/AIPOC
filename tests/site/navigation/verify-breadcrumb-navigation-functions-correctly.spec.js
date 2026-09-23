// case: TC-1602309
// spec: specs/tc-1602308-1602312-how-to-vote-pages-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { expectBreadcrumb, clickBreadcrumbLink } = require('../../helpers/navHelper');
const { REGISTER_URL } = require('../../helpers/registerToVoteHelper');
const { url } = require('../../helpers/siteConfig');

test.describe('Breadcrumb', { tag: ['@smoke', '@regression'] }, () => {
  test('Verify breadcrumb navigation functions correctly', async ({ page }) => {
    // 1. Navigate to the Register to vote page
    await page.goto(REGISTER_URL);
    await expectBreadcrumb(page, ['Home', 'How to vote', 'Register to vote: guidance for Londoners']);

    // 2. Click 'Home' in the breadcrumb
    await clickBreadcrumbLink(page, 'Home');
    await expect(page).toHaveURL(url('/'));

    // 3. Navigate back to the Register to vote page and click 'How to vote' in the breadcrumb
    await page.goto(REGISTER_URL);
    await clickBreadcrumbLink(page, 'How to vote');
    await expect(page).toHaveURL(/\/how-to-vote$/);
  });
});
