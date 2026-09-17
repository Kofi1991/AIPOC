// spec: specs/tc-1578344-generic-page-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../helpers/authHelper');
const {
  openGenericPageForm,
  expectGenericPageFieldRequirements,
  createGenericPage,
} = require('../helpers/contentPageHelper');

test.describe('Generic Page Creation', () => {
  // Each auth test runs in its own isolated (incognito) context: log in fresh here,
  // log out afterwards so the account's single session slot is released.
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That All Required Specs Is Displayed When Creating A Generic Content Page', async ({ page }) => {
    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Generic Content Page
    await openGenericPageForm(page);

    // AND the following fields (Title, Summary, Body) should be visible to the User,
    // with Title and Summary mandatory and Body optional
    await expectGenericPageFieldRequirements(page);

    // THEN the User will be able to create a Generic Content Page
    const title = `Generic page ${Date.now()}`;
    await createGenericPage(page, title, 'Automated test summary');
    await expect(page).not.toHaveURL(/\/node\/add\/page$/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  });
});
