// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: the Site Admin steps are not automated — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.
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

test.describe('Landing Page Editing', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify Users Are Able to Edit Newly Created Landing Content Page', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    const title = `Landing to edit ${Date.now()}`;
    const newTitle = `${title} EDITED`;
    await openContentForm(page, 'landing');
    await createLandingPage(page, { title, summary: 'Original summary' });

    let current = title;
    try {
      await editContentItemFromList(page, title);
      await dismissAutosaveDialog(page);
      await page.getByRole('textbox', { name: 'Title *' }).fill(newTitle);
      await saveAndClose(page);
      await expect(page).toHaveURL(/\/admin\/content/);
      current = newTitle;

      // THEN the changes are reflected in the CMS list and on the page
      await expectContentItemInList(page, newTitle);
      await openNodePageFromList(page, newTitle);
      await expect(page.getByRole('heading', { level: 1, name: newTitle })).toBeVisible();
    } finally {
      await deleteQuietly(page, current);
    }
  });
});
