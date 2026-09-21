// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: the Landing form has no Body field, unlike the case (see plan Drift).
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

test.describe('Landing Page Required Fields', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That All Required Specs Is Displayed When Creating A Landing Content Page', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Landing Content Page AND the fields are visible
    await openContentForm(page, 'landing');
    await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Summary *' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Hero image' })).toBeVisible();
    const cta = page.getByRole('group', { name: 'CTA' });
    await expect(cta.getByRole('textbox', { name: 'URL' })).toBeVisible();
    await expect(cta.getByRole('textbox', { name: 'Link text' })).toBeVisible();

    // AND only Title and Summary are mandatory: the page saves with Hero image and CTA left empty
    const title = `Landing required fields ${Date.now()}`;
    try {
      await createLandingPage(page, { title, summary: 'Summary for the required fields test' });
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
