// case: TC-1578390
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

test.describe('Generic Page Deletion (BBD)', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify user is able to delete Generic Content Pages', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    const title = `Generic to delete role ${Date.now()}`;
    await openGenericPageForm(page);
    await createGenericPage(page, title, 'Automated summary for delete test');
    await page.waitForURL((url) => !url.pathname.startsWith('/node/add'));
    await expectContentItemInList(page, title);

    // Step 1: the dropdown next to Edit > Delete > confirm with Save & Close
    await deleteContentItemFromList(page, title);

    // Step 2: the page is deleted and no longer visible — checked in the CMS (the "has been deleted"
    // message lives in the shared Drupal session, so it isn't asserted)
    await expectContentItemAbsentFromList(page, title);
  });
});
