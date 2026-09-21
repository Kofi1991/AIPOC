// spec: specs/tc-1578347-1578348-1578352-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes case steps 3-4 (SiteAdmin) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../helpers/authHelper');
const { openGenericPageForm, createGenericPage, editContentItemFromList } = require('../helpers/contentPageHelper');

test.describe('Generic Page Editing', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify Users Are Able to Edit Newly Created Generic Content Pages.', async ({ page }) => {
    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN all required fields have been filled in and the page is saved (precondition)
    const title = `Generic page to edit ${Date.now()}`;
    await openGenericPageForm(page);
    await createGenericPage(page, title, 'Original summary');
    await expect(page).not.toHaveURL(/\/node\/add\/page$/);

    // WHEN the User searches the CMS for the newly created page and edits it
    await editContentItemFromList(page, title);
    const newTitle = `${title} EDITED`;
    await page.getByRole('textbox', { name: 'Title *' }).fill(newTitle);
    await page.getByRole('button', { name: 'Save & Close' }).first().click();

    // THEN the changes will be reflected on the page
    await expect(page).toHaveURL(/\/admin\/content$/);
    // The "has been updated" message isn't asserted: it lives in the Drupal session, which specs
    // share via TC_ADMIN_SESSION, so another tab can show it instead. The row below is durable proof.
    await expect(page.locator('tr', { hasText: newTitle })).toBeVisible();
  });
});
