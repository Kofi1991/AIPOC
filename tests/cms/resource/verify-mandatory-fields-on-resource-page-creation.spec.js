// case: TC-1578403
// spec: specs/tc-1578403-1578410-resource-and-collection-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes step 5 (Site Admin) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const {
  openContentForm, pickMediaForField, saveAndClose, saveAndWaitForNodePage,
  expectBlankSubmitBlockedByBrowser, deleteQuietly,
} = require('../../helpers/contentTypeHelper');
const { setRichTextBody, expectContentItemAbsentFromList } = require('../../helpers/contentPageHelper');

test.describe('Resource Validation (BBD)', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify mandatory fields on Resource page creation', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Step 1: Title and Resource download indicate they are required
    await openContentForm(page, 'resource');
    const titleField = page.getByRole('textbox', { name: 'Title *' });
    await expect(titleField).toBeVisible();
    await expect(page.getByRole('group', { name: 'Resource download *' })).toBeVisible();

    // Step 2: skip the required fields, complete only the optional ones, Save & Close
    await pickMediaForField(page, 'Thumbnail image');
    await page.getByRole('textbox', { name: 'Summary' }).fill('Optional-only summary');
    await setRichTextBody(page, '<p>Optional-only body</p>');
    await page.getByRole('combobox', { name: 'Language' }).selectOption({ index: 1 });
    await page.getByRole('group', { name: 'Category' }).getByRole('checkbox').first().check();
    await expectBlankSubmitBlockedByBrowser(page, [titleField]);

    // Steps 3-4: start clean, complete only the required fields, Save & Close
    await openContentForm(page, 'resource');
    const title = `Resource mandatory role ${Date.now()}`;
    try {
      await page.getByRole('textbox', { name: 'Title *' }).fill(title);
      await saveAndClose(page);
      // Title alone still isn't enough — Resource download is checked server-side
      await expect(page.getByText('Resource download field is required.').first()).toBeVisible();
      await expect(page).toHaveURL(/\/node\/add\/resource$/);

      await pickMediaForField(page, 'Resource download *');
      await saveAndWaitForNodePage(page);

      // THEN the page saves and the User is on the FE of the created page
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
