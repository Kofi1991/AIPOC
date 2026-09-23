// case: TC-1578357
// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: Hero Image and CTA named in the case do not exist on the Homepage form (see plan Drift).
const { test, expect } = require('@playwright/test');
const { login, logout, navigateToBlogCreation, dismissAutosaveDialog } = require('../../helpers/authHelper');
const {
  openContentForm, createHomepage, createLandingPage, createResource, saveAndClose, saveAndWaitForNodePage,
  pickMediaForField, expectBlankSubmitBlockedByBrowser, openNodePageFromList, slugify, deleteQuietly,
  typeTitleFormattedAsHeading, addTextParagraph,
} = require('../../helpers/contentTypeHelper');
const {
  expectContentItemInList, expectContentItemAbsentFromList, deleteContentItemFromList, editContentItemFromList,
  filterContentListByTitle, setRichTextBody, addLatestNewsAndBlogsParagraph, expectLatestNewsAndBlogsParagraphVisible,
  openGenericPageForm, createGenericPage,
} = require('../../helpers/contentPageHelper');

test.describe('Homepage Required Fields', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That All Required Specs Is Displayed When Creating A Homepage Content Page', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Homepage AND the fields are visible and marked mandatory
    await openContentForm(page, 'homepage');
    await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible();
    await expect(page.locator('label.form-required', { hasText: 'Title formatted' })).toBeVisible();
    await expect(page.getByRole('application', { name: 'Rich Text Editor' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Summary *' })).toBeVisible();

    // THEN the User will be able to create a Homepage Content Page
    const title = `Homepage required fields ${Date.now()}`;
    try {
      await createHomepage(page, { title, summary: 'Summary for the required fields test' });
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
