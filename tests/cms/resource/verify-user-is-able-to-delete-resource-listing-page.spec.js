// case: TC-1578368
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

test.describe('Resource Deletion', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify User Is Able To Delete Resource Listing Page', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    const title = `Resource to delete ${Date.now()}`;
    await openContentForm(page, 'resource');
    await createResource(page, { title });
    await expectContentItemInList(page, title);

    // WHEN the User views the Content CMS List AND deletes the Resource
    await deleteContentItemFromList(page, title);

    // THEN the selected page will be deleted (checked in the CMS)
    await expectContentItemAbsentFromList(page, title);
  });
});
