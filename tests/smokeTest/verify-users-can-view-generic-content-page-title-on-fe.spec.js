// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: 'only the Title is visible' is checked as: Title is the H1 and the Summary is not shown.
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

test.describe('Generic Page Front End', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify Users can view Generic Content Page title on FE', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    const title = `Generic title on FE ${Date.now()}`;
    const summary = `Generic FE summary ${Date.now()}`;
    await openGenericPageForm(page);
    try {
      await createGenericPage(page, title, summary);
      await page.waitForURL((url) => !url.pathname.startsWith('/node/add'));

      // Step 1: the User is on the FE of the new page and sees the Title
      // Step 2: the Title appears as an H1
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      // AND only the Title is shown: the Summary text is not displayed on the FE
      await expect(page.getByText(summary)).toHaveCount(0);
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
