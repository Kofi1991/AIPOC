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
const { createBlogPost } = require('../helpers/blogPostHelper');

test.describe('News Article / Blog Post Deletion (BBD)', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify user is able to delete News Articles / Blog Posts', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    const title = `News to delete role ${Date.now()}`;
    await navigateToBlogCreation(page);
    await createBlogPost(page, { title, summary: 'Automated summary for delete test' });
    await expectContentItemInList(page, title);

    // Step 1: the dropdown next to Edit > Delete > confirm with Save & Close
    await deleteContentItemFromList(page, title);

    // Step 2: the node is deleted and no longer visible — checked in the CMS
    await expectContentItemAbsentFromList(page, title);
  });
});
