// spec: specs/tc-1602308-1602312-how-to-vote-pages-plan.md
// seed: tests/seed.spec.ts
// NOTE: the case says "hover over or click" — hover is what reveals the submenu; clicking the
// parent link navigates straight to /how-to-vote, so only hover is exercised.

const { test, expect } = require('@playwright/test');
const { expectSubmenuOptions, clickSubmenuItem } = require('../../helpers/navHelper');
const { url } = require('../../helpers/siteConfig');

test.describe('Main Navigation', { tag: ['@smoke', '@regression'] }, () => {
  test('Verify submenu navigation for How to vote section', async ({ page }) => {
    await page.goto(url('/'));

    // 1. Hover 'How to vote' in the main navigation
    await expectSubmenuOptions(page, 'How to vote', ['Register to vote', 'Voter ID', 'Ways to vote', 'Why vote?']);

    // 2. Click 'Voter ID' in the submenu
    await clickSubmenuItem(page, 'How to vote', 'Voter ID');
    await expect(page).toHaveURL(/\/how-to-vote\/voter-id$/);

    // 3. Click 'Ways to vote' in the submenu
    await clickSubmenuItem(page, 'How to vote', 'Ways to vote');
    await expect(page).toHaveURL(/\/how-to-vote\/ways-to-vote$/);
  });
});
