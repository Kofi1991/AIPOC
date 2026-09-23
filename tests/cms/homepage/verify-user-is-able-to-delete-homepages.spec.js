// case: TC-1578394
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

test.describe('Homepage Deletion (BBD)', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify user is able to delete Homepages', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: an existing Homepage to delete
    const title = `Homepage to delete ${Date.now()}`;
    await openContentForm(page, 'homepage');
    await createHomepage(page, { title, summary: 'Automated summary for delete test' });
    // Positive control: the lookup used below must find it first
    await expectContentItemInList(page, title);

    // WHEN the User views the Content CMS list AND deletes the page (dropdown next to Edit > Delete > Save & Close)
    await deleteContentItemFromList(page, title);

    // THEN the selected page will be deleted — checked in the CMS, not via the session-stored message
    await expectContentItemAbsentFromList(page, title);
  });
});
