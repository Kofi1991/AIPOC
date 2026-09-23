// case: TC-1578356
// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes case step 2 (Site Admin), and Hero Image / CTA — the Homepage form has neither (see plan Drift).
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

test.describe('Homepage Validation', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That All Mandatory Fields Within Homepage Function as Expected', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Homepage AND Title and Summary are blank
    await openContentForm(page, 'homepage');
    const titleField = page.getByRole('textbox', { name: 'Title *' });
    const summaryField = page.getByRole('textbox', { name: 'Summary *' });
    await expect(titleField).toHaveValue('');
    await expect(summaryField).toHaveValue('');

    // THEN the Page will not be created: the browser blocks the submit (Title, Summary)
    await expectBlankSubmitBlockedByBrowser(page, [titleField, summaryField]);

    // AND "Title formatted" is checked by the server: with the other two filled, it still won't save
    const title = `Homepage mandatory ${Date.now()}`;
    await titleField.fill(title);
    await summaryField.fill('Summary for the mandatory fields test');
    await saveAndClose(page);
    await expect(page.getByText(/Title formatted field is required/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/node\/add\/homepage/);
    await expectContentItemAbsentFromList(page, title);
  });
});
