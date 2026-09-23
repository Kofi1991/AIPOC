// case: TC-1578364
// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: the case says Summary is mandatory in one line and optional in the next; the form marks only Title and Resource download (see plan Drift).
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

test.describe('Resource Required Fields', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That All Required Specs Is Displayed When Creating A Resoruce Listing Page', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Resource AND the fields are visible
    await openContentForm(page, 'resource');
    await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Summary' })).toBeVisible();
    await expect(page.getByRole('application', { name: 'Rich Text Editor' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Resource download *' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Thumbnail image' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Language' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Category' })).toBeVisible();

    // AND only Title and Resource download are mandatory: it saves with everything else empty
    const title = `Resource required fields ${Date.now()}`;
    try {
      await createResource(page, { title });
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
