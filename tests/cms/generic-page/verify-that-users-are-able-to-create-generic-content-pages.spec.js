// case: TC-1578346
// spec: specs/tc-1578346-generic-page-creation-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const {
  openGenericPageForm,
  addLatestNewsAndBlogsParagraph,
  expectLatestNewsAndBlogsParagraphVisible,
} = require('../../helpers/contentPageHelper');

test.describe('Generic Page Creation', { tag: ['@smoke', '@regression'] }, () => {
  // Each auth test runs in its own isolated (incognito) context: log in fresh here,
  // log out afterwards so the account's single session slot is released.
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That Users Are Able To Create  Generic Content Pages.', async ({ page }) => {
    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Generic Content Page with Title, Summary,
    // Body and a Paragraph (Latest news and blogs) filled in
    await openGenericPageForm(page);

    const title = `Generic page ${Date.now()}`;
    const summary = `Automated summary ${Date.now()}`;

    await page.getByRole('textbox', { name: 'Title *' }).fill(title);
    await page.getByRole('textbox', { name: 'Summary *' }).fill(summary);
    await page.getByRole('application', { name: 'Rich Text Editor' }).click();
    await page.keyboard.type('Automated body text');
    await addLatestNewsAndBlogsParagraph(page);

    // AND the page is saved without any errors
    await page.getByRole('button', { name: 'Save & Close' }).first().click();

    // THEN the Generic Page will be created
    await expect(page).not.toHaveURL(/\/node\/add\/page$/);

    // AND Summary should NOT be displayed on the created page
    await expect(page.getByText(summary)).toHaveCount(0);

    // AND Title will appear in H1 format AND the selected Paragraph is displayed
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expectLatestNewsAndBlogsParagraphVisible(page);
  });
});
