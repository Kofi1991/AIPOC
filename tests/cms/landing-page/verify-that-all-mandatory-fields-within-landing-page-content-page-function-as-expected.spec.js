// case: TC-1578361
// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: the Site Admin steps are not automated — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.
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

test.describe('Landing Page Validation', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That All Mandatory Fields Within Landing Page  Content Page Function as Expected', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Landing Page Content Page AND Title and Summary are blank
    await openContentForm(page, 'landing');
    const titleField = page.getByRole('textbox', { name: 'Title *' });
    const summaryField = page.getByRole('textbox', { name: 'Summary *' });
    await expect(titleField).toHaveValue('');
    await expect(summaryField).toHaveValue('');

    // THEN the Page will not be created (browser blocks the submit; still on the form)
    await expectBlankSubmitBlockedByBrowser(page, [titleField, summaryField]);
  });
});
