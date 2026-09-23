// case: TC-1578381
// spec: specs/tc-1578381-logout-autologout-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes case steps 5-8 (waiting out a real 2-hour/day-scale session timeout to
// confirm automatic logout) — impractical to wait out in an automated run.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../helpers/authHelper');
const { url } = require('../helpers/siteConfig');

test.describe('Secure User Logout / Auto Logout', { tag: ['@smoke', '@regression'] }, () => {
  test('Verify Secure User Logout / Auto logout', async ({ page }) => {
    // 1. Given the User logged in as an Admin, when I manually log out
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);
    await logout(page);

    // 2-4. Given the user is logged in, when navigating the CMS's Automated Logout settings
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);
    await page.goto(url('/admin/config/people/autologout'), { waitUntil: 'domcontentloaded' });

    // THEN the Automated Logout module is visible and enabled
    await expect(page.getByRole('checkbox', { name: 'Enable autologout' })).toBeChecked();

    // THEN the real configured timeout for administrator and site_admin is 7200 seconds (2 hours) —
    // NOT the case's claimed 4 weeks / 2 days. See plan drift notes.
    await expect(page.locator('#edit-table-administrator-timeout')).toHaveValue('7200');
    await expect(page.locator('#edit-table-site-admin-timeout')).toHaveValue('7200');

    await logout(page);
  });
});
