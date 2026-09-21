// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: the image caption in step 4 is not asserted — no caption exists on the page (see plan Drift).
const { test, expect } = require('@playwright/test');
const { login, logout, navigateToBlogCreation, dismissAutosaveDialog } = require('../helpers/authHelper');
const {
  openContentForm, createHomepage, createLandingPage, createResource, saveAndClose, saveAndWaitForNodePage,
  pickMediaForField, expectBlankSubmitBlockedByBrowser, openNodePageFromList, slugify, deleteQuietly,
  typeTitleFormattedAsHeading, addTextParagraph,
} = require('../helpers/contentTypeHelper');
const {
  expectContentItemInList, expectContentItemAbsentFromList, deleteContentItemFromList, editContentItemFromList,
  filterContentListByTitle, setRichTextBody, addLatestNewsAndBlogsParagraph, expectLatestNewsAndBlogsParagraphVisible,
  openGenericPageForm, createGenericPage,
} = require('../helpers/contentPageHelper');

test.describe('Resource Creation', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That Users Are Able To Create Resource Listing Page.', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Resource AND fills Title, Summary, Body, Image, Language, Resource download, Category
    await openContentForm(page, 'resource');
    const title = `Resource to create ${Date.now()}`;
    const summary = `Resource summary ${Date.now()}`;
    try {
      await page.getByRole('textbox', { name: 'Title *' }).fill(title);
      await page.getByRole('textbox', { name: 'Summary' }).fill(summary);
      await setRichTextBody(page, '<p>Automated resource body text</p>');
      await pickMediaForField(page, 'Thumbnail image');
      await page.getByRole('combobox', { name: 'Language' }).selectOption({ index: 1 });
      await pickMediaForField(page, 'Resource download *');
      await page.getByRole('group', { name: 'Category' }).getByRole('checkbox').first().check();
      await saveAndWaitForNodePage(page);

      // THEN the Page will be created, and its Title is the H1
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      // AND the Summary is NOT displayed on the FE
      await expect(page.getByText(summary)).toHaveCount(0);
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
