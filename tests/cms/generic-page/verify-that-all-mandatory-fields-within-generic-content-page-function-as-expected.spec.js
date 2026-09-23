// case: TC-1578345
// spec: specs/tc-1578345-generic-page-mandatory-fields-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const { openGenericPageForm } = require('../../helpers/contentPageHelper');

test.describe('Generic Page Validation', { tag: ['@regression'] }, () => {
  // Each auth test runs in its own isolated (incognito) context: log in fresh here,
  // log out afterwards so the account's single session slot is released.
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That All Mandatory Fields Within Generic Content Page Function as Expected', async ({ page }) => {
    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Generic Content Page
    await openGenericPageForm(page);
    const formUrl = page.url();

    const titleField = page.getByRole('textbox', { name: 'Title *' });
    const summaryField = page.getByRole('textbox', { name: 'Summary *' });

    // AND Title and Summary are left blank
    await expect(titleField).toHaveValue('');
    await expect(summaryField).toHaveValue('');
    await page.getByRole('button', { name: 'Save & Close' }).first().click();

    // THEN the Page will not be created — the browser's native required-field
    // validation blocks submission and displays a "please fill (out|in) this
    // field" message on each blank field. That message is rendered by the
    // browser as a native tooltip outside the page DOM (confirmed via
    // screenshot), so it can't be queried with a locator; checking :invalid
    // plus the validationMessage text is the reliable way to assert it is
    // shown. Wording varies by Chromium build ("fill out" headless vs.
    // "fill in" headed) even on the same browser/locale, so match either.
    const requiredFieldMessage = /please fill (out|in) this field\.?/i;
    await expect(page).toHaveURL(formUrl);
    expect(await titleField.evaluate((el) => el.matches(':invalid'))).toBe(true);
    expect(await summaryField.evaluate((el) => el.matches(':invalid'))).toBe(true);
    expect(await titleField.evaluate((el) => el.validationMessage)).toMatch(requiredFieldMessage);
    expect(await summaryField.evaluate((el) => el.validationMessage)).toMatch(requiredFieldMessage);
  });
});
