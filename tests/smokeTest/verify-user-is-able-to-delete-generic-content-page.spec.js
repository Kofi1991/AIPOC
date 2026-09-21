// spec: specs/tc-1578349-generic-page-delete-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../helpers/authHelper');
const {
  openGenericPageForm,
  createGenericPage,
  deleteContentItemFromList,
  expectContentItemInList,
  expectContentItemAbsentFromList,
} = require('../helpers/contentPageHelper');

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
    // Positive control: the same CMS lookup used below must find the page first, so
    // "not found" after deleting can't be a lookup that never worked.
    await expectContentItemInList(page, title);

    // WHEN the User views the Content CMS List AND deletes the existing Generic Content Page
    await deleteContentItemFromList(page, title);

    // THEN the selected page will be deleted — checked in the CMS itself. The "has been
    // deleted" message isn't asserted: Drupal stores it in the session, which specs share
    // via TC_ADMIN_SESSION, so another tab can display it instead and this one never sees it.
    await expectContentItemAbsentFromList(page, title);
  });
});
