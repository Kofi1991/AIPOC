// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: 'only these fields display' is checked for the two named fields, not as an exhaustive page inventory.
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

test.describe('Homepage Front End', { tag: ['@smoke', '@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify users can view Homepage content on FE', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Homepage created with only the required fields
    const title = `Homepage view ${Date.now()}`;
    const formatted = `${title} formatted`;
    const summary = 'Summary shown on the homepage front end';
    await openContentForm(page, 'homepage');
    try {
      await createHomepage(page, { title, titleFormatted: formatted, summary });

      // THEN the Title Formatted (as an H1) and the Summary display on the FE
      await expect(page.getByRole('heading', { level: 1, name: formatted })).toBeVisible();
      await expect(page.getByText(summary)).toBeVisible();

      // AND the URL extension matches the Title
      expect(new URL(page.url()).pathname).toBe(`/${slugify(title)}`);
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
