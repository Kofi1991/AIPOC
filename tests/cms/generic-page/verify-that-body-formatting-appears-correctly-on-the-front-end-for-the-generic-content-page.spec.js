// case: TC-1578347
// spec: specs/tc-1578347-1578348-1578352-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const { openGenericPageForm, setRichTextBody } = require('../../helpers/contentPageHelper');

test.describe('Generic Page Body Formatting', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That Body Formatting Appears Correctly on the Front End for the Generic Content Page', async ({ page }) => {
    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN all required fields have been filled in, including Body with Bold, Underline and a Link
    await openGenericPageForm(page);
    const title = `Generic page formatting ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Title *' }).fill(title);
    await page.getByRole('textbox', { name: 'Summary *' }).fill('Automated summary');
    await setRichTextBody(
      page,
      '<p><strong>BoldWord</strong> <u>UnderlineWord</u> <a href="https://example.com">LinkWord</a></p>'
    );

    // AND the page is saved without any errors
    await page.getByRole('button', { name: 'Save & Close' }).first().click();

    // THEN the Generic Page will be created
    await expect(page).not.toHaveURL(/\/node\/add\/page$/);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();

    // AND viewing the page, all formatting applied to the Body field will be displayed
    const html = await page.content();
    expect(html).toContain('<strong>BoldWord</strong>');
    expect(html).toContain('<u>UnderlineWord</u>');
    expect(html).toContain('href="https://example.com"');
  });
});
