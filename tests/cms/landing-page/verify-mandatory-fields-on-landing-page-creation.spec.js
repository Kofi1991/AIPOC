// spec: specs/tc-1578395-1578398-landing-page-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes step 5 (Site Admin) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const {
  openContentForm, pickMediaForField, saveAndClose, saveAndWaitForNodePage,
  expectBlankSubmitBlockedByBrowser, deleteQuietly,
} = require('../../helpers/contentTypeHelper');

test.describe('Landing Page Validation (BBD)', { tag: ['@smoke', '@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify mandatory fields on Landing Page creation', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Step 1: Title and Summary indicate they are required
    await openContentForm(page, 'landing');
    const titleField = page.getByRole('textbox', { name: 'Title *' });
    const summaryField = page.getByRole('textbox', { name: 'Summary *' });
    await expect(titleField).toBeVisible();
    await expect(summaryField).toBeVisible();

    // Step 2: skip the required fields, complete only the optional Hero image and CTA,
    // Save & Close. (The case also lists "Body" as skippable, but the Landing form has no
    // Body field — see the plan's Drift.)
    await pickMediaForField(page, 'Hero image');
    const cta = page.getByRole('group', { name: 'CTA' });
    await cta.getByRole('textbox', { name: 'URL' }).fill('https://www.gov.uk/register-to-vote');
    await cta.getByRole('textbox', { name: 'Link text' }).fill('Register now');
    await expectBlankSubmitBlockedByBrowser(page, [titleField]);

    // Steps 3-4: start clean, complete only the required fields, Save & Close
    await openContentForm(page, 'landing');
    const title = `Landing mandatory role ${Date.now()}`;
    try {
      await page.getByRole('textbox', { name: 'Title *' }).fill(title);
      await page.getByRole('textbox', { name: 'Summary *' }).fill('Required-only summary');
      await saveAndWaitForNodePage(page);

      // THEN the page saves and the User is on the FE of the created page
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
