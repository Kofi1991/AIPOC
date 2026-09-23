// spec: specs/tc-1578362-1578374-news-article-blog-post-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes case step 2 (Site Admin) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.

const { test, expect } = require('@playwright/test');
const { login, logout, navigateToBlogCreation } = require('../../helpers/authHelper');
const { expectContentItemAbsentFromList } = require('../../helpers/contentPageHelper');

test.describe('News Article / Blog Post Validation', { tag: ['@smoke', '@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That All Mandatory Fields Within News Article/ Blog Post Page Function as Expected', async ({ page }) => {
    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new News Article/ Blog Post
    await navigateToBlogCreation(page);
    const formUrl = page.url();
    const titleField = page.getByRole('textbox', { name: 'Title *' });
    const summaryField = page.getByRole('textbox', { name: 'Summary *' });
    const typeField = page.getByRole('combobox', { name: 'Type *' });

    // AND Title, Image and Summary are blank
    await expect(titleField).toHaveValue('');
    await expect(summaryField).toHaveValue('');
    await page.getByRole('button', { name: 'Save & Close' }).first().click();

    // THEN the Page will not be created. Title and Summary are stopped by the browser's native
    // required-field validation (a tooltip outside the DOM, so check :invalid + validationMessage;
    // wording is "fill out" or "fill in" depending on the Chromium build).
    const requiredFieldMessage = /please fill (out|in) this field\.?/i;
    await expect(page).toHaveURL(formUrl);
    expect(await titleField.evaluate((el) => el.matches(':invalid'))).toBe(true);
    expect(await summaryField.evaluate((el) => el.matches(':invalid'))).toBe(true);
    expect(await titleField.evaluate((el) => el.validationMessage)).toMatch(requiredFieldMessage);
    expect(await summaryField.evaluate((el) => el.validationMessage)).toMatch(requiredFieldMessage);

    // Type can't be blank: the select has no empty option, so it always has a value.
    await expect(typeField).not.toHaveValue('');

    // Image is checked by the server, not the browser: with Title and Summary filled and the
    // Image left empty the save is rejected and the form stays put.
    const title = `Blog post mandatory ${Date.now()}`;
    await titleField.fill(title);
    await summaryField.fill('Summary for the mandatory fields test');
    await page.getByRole('button', { name: 'Save & Close' }).first().click();
    await expect(page.getByText('Image field is required.').first()).toBeVisible();
    await expect(page).toHaveURL(/\/node\/add\/news_article_blog_post/);

    // And the page really wasn't created — checked in the CMS itself.
    await expectContentItemAbsentFromList(page, title);
  });
});
