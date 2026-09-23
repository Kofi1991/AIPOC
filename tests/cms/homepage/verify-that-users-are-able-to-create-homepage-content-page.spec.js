// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: case step 2 (summary NOT shown) and the image/CTA parts of step 3 are not automated — see plan Drift.
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

test.describe('Homepage Creation', { tag: ['@smoke', '@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That Users Are Able To Create  Homepage Content Page', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN all required fields have been filled in AND the page is saved without errors
    await openContentForm(page, 'homepage');
    const title = `Homepage to create ${Date.now()}`;
    const formatted = `${title} formatted`;
    try {
      await createHomepage(page, { title, titleFormatted: formatted, summary: 'Automated summary for create test' });

      // THEN the Page will be created and the User is taken to it
      await expect(page).not.toHaveURL(/\/node\/add\//);
      // WHEN viewing it THEN the Title Formatted text appears as the H1
      await expect(page.getByRole('heading', { level: 1, name: formatted })).toBeVisible();
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
