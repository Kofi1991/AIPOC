// spec: specs/tc-1578349-generic-page-delete-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../helpers/authHelper');
const { openGenericPageForm, createGenericPage, deleteContentItemFromList } = require('../helpers/contentPageHelper');

test.describe('Generic Page Deletion', () => {
  // Each auth test runs in its own isolated (incognito) context: log in fresh here,
  // log out afterwards so the account's single session slot is released.
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify User Is Able To Delete Generic Content Page', async ({ page }) => {
    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: an existing Generic page to delete
    const title = `Generic page to delete ${Date.now()}`;
    await openGenericPageForm(page);
    await createGenericPage(page, title, 'Automated summary for delete test');
    await expect(page).not.toHaveURL(/\/node\/add\/page$/);

    // WHEN the User views the Content CMS List AND deletes the existing Generic Content Page
    await deleteContentItemFromList(page, title);

    // THEN the selected page will be deleted
    await expect(page.getByText(`The Generic page ${title} has been deleted.`)).toBeVisible();
    await expect(page.locator('tr', { hasText: title })).toHaveCount(0);
  });
});
