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

test.describe('Generic Page Validation (BBD)', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify mandatory fields on Generic Content Page creation', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Step 1: Title and Summary indicate they are required
    await openGenericPageForm(page);
    const titleField = page.getByRole('textbox', { name: 'Title *' });
    const summaryField = page.getByRole('textbox', { name: 'Summary *' });
    await expect(titleField).toBeVisible();
    await expect(summaryField).toBeVisible();

    // Step 2: skip the required fields, complete only the optional Body, Save & Close
    await setRichTextBody(page, '<p>Body only, no title or summary</p>');
    await expect(page.getByRole('application', { name: 'Rich Text Editor' })).toContainText('Body only');
    await expectBlankSubmitBlockedByBrowser(page, [titleField, summaryField]);

    // Step 3: start clean and complete only the required fields, Save & Close
    await openGenericPageForm(page);
    const title = `Generic mandatory role ${Date.now()}`;
    try {
      await createGenericPage(page, title, 'Required-only summary');
      // THEN the page saves and the User is on the FE of the created page
      await page.waitForURL((url) => !url.pathname.startsWith('/node/add'));
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
