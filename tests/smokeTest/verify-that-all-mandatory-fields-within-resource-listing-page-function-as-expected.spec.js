// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: the Site Admin steps are not automated — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.
// NOTE: 'Resource Listing Page' in the case is the 'Resource' content type — see plan Drift.
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

test.describe('Resource Validation', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That All Mandatory Fields Within Resource Listing Page Function as Expected', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Resource AND Title and Resource Download are blank
    await openContentForm(page, 'resource');
    const titleField = page.getByRole('textbox', { name: 'Title *' });
    await expect(titleField).toHaveValue('');
    await expect(page.getByRole('group', { name: 'Resource download *' })).toBeVisible();

    // THEN the Page will not be created: the browser blocks the blank Title...
    await expectBlankSubmitBlockedByBrowser(page, [titleField]);

    // ...and, with a Title but no Resource download, the server rejects the save
    const title = `Resource mandatory ${Date.now()}`;
    await titleField.fill(title);
    await saveAndClose(page);
    await expect(page.getByText('Resource download field is required.').first()).toBeVisible();
    await expect(page).toHaveURL(/\/node\/add\/resource/);
    await expectContentItemAbsentFromList(page, title);
  });
});
