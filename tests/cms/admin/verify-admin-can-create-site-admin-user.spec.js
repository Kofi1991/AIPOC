// case: TC-1578415
// spec: specs/tc-1578411-1578415-plan.md
// seed: tests/seed.spec.ts
// NOTE: step 5 ("see original test plan for step details") has no content in TestCollab to
// automate — treated as the end of the case at step 4. See plan Drift.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const { url } = require('../../helpers/siteConfig');

// Meets the site's live password policy (min 13 chars, 3+ of lower/upper/digit/special, no
// repeated consecutive characters) — fixed rather than timestamp-derived, since a
// timestamp-based password intermittently tripped the "no consecutive identical characters"
// rule. See plan Drift.
const SITE_ADMIN_PASSWORD = 'Vote#London2026Xz';

test.describe('Admin User Creation', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify that Admin user permissions work correctly', async ({ page }) => {
    test.setTimeout(90_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    const ts = Date.now();
    const username = `siteadmin-${ts}`;
    const email = `siteadmin-${ts}@example.com`;

    try {
      // Step 1: fill in the required fields and select the Site admin role
      await page.goto(url('/admin/people/create'), { waitUntil: 'domcontentloaded' });
      await page.getByRole('textbox', { name: 'Email address' }).fill(email);
      await page.getByRole('textbox', { name: 'Username *' }).fill(username);
      // A short settle wait before filling: the password-strength widget attaches to the field
      // shortly after load, and filling both fields immediately intermittently left them out of
      // sync ("the specified passwords do not match") — see plan Drift.
      await page.waitForTimeout(500);
      const pass1 = page.locator('input[name="pass[pass1]"]');
      const pass2 = page.locator('input[name="pass[pass2]"]');
      await pass1.click();
      await pass1.pressSequentially(SITE_ADMIN_PASSWORD, { delay: 20 });
      await pass2.click();
      await pass2.pressSequentially(SITE_ADMIN_PASSWORD, { delay: 20 });
      await page.getByRole('checkbox', { name: 'Site admin' }).check();

      // Step 2: create the account
      await page.getByRole('button', { name: 'Create new account' }).click();
      await page.waitForLoadState('domcontentloaded');

      // Step 3: confirmation message
      await expect(page.getByText(`Created a new user account for ${username}. No email has been sent.`)).toBeVisible();

      // Step 4: the People list shows the new Site Admin, Active
      await page.getByRole('link', { name: 'People', exact: true }).click();
      await page.waitForLoadState('domcontentloaded');
      const row = page.locator('tr', { hasText: username });
      await expect(row).toBeVisible();
      await expect(row).toContainText('Active');
    } finally {
      // Cleanup: cancel the account. Deletion runs as a Drupal batch job (redirects through
      // /batch before landing back on /admin/people) — see plan Drift.
      await page.goto(url('/admin/people'), { waitUntil: 'domcontentloaded' });
      const row = page.locator('tr', { hasText: username });
      const href = await row.locator('a').first().getAttribute('href').catch(() => null);
      if (href) {
        const uidMatch = href.match(/\/user\/(\d+)/);
        if (uidMatch) {
          await page.goto(url(`/user/${uidMatch[1]}/cancel`), { waitUntil: 'domcontentloaded' });
          const deleteRadio = page.getByRole('radio', { name: /Delete the account and its content/i });
          if (await deleteRadio.isVisible().catch(() => false)) {
            await deleteRadio.check();
            await page.getByRole('button', { name: 'Confirm' }).click();
            await page.waitForURL((u) => !u.pathname.includes('/batch'), { timeout: 20000 }).catch(() => {});
          }
        }
      }
    }
  });
});
