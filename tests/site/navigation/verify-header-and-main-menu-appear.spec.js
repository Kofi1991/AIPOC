// spec: specs/tc-1578342-header-main-menu-plan.md
// seed: tests/seed.spec.ts
// NOTE: scoped to the case's public/no-auth steps 1-3 only. Steps 4-13 (Site Admin / Admin
// menu-item CRUD via CMS) are deferred — the project's admin account is currently locked out.

const { test } = require('@playwright/test');
const { expectHeaderBanner, expectLogoNavigatesHome } = require('../../helpers/navHelper');
const { url } = require('../../helpers/siteConfig');

test.describe('Header and Main Menu', { tag: ['@smoke', '@regression'] }, () => {
  test('Verify Header and Main Menu Appear', async ({ page }) => {
    // 1. Navigate to the homepage and inspect the top banner
    await page.goto(url('/'));
    await expectHeaderBanner(page);

    // 2. From a non-home page, click the header logo
    await expectLogoNavigatesHome(page, url('/resources'));
  });
});
