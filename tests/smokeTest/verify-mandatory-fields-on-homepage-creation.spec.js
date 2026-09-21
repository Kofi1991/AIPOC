// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes step 5 (Site Admin) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.
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

test.describe('Homepage Validation (BBD)', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify mandatory fields on Homepage creation', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Step 1: Title, Title Formatted and Summary indicate they are required
    await openContentForm(page, 'homepage');
    const titleField = page.getByRole('textbox', { name: 'Title *' });
    const summaryField = page.getByRole('textbox', { name: 'Summary *' });
    await expect(titleField).toBeVisible();
    await expect(page.locator('label.form-required', { hasText: 'Title formatted' })).toBeVisible();
    await expect(summaryField).toBeVisible();

    // Step 2: skip the required fields, complete only the optional "Add Paragraph", Save & Close
    await addLatestNewsAndBlogsParagraph(page);
    await expectBlankSubmitBlockedByBrowser(page, [titleField, summaryField]);

    // Steps 3-4: start clean, complete only the required fields (Title formatted as an H1 via the
    // editor's heading dropdown), Save & Close
    await openContentForm(page, 'homepage');
    const title = `Homepage mandatory role ${Date.now()}`;
    try {
      await page.getByRole('textbox', { name: 'Title *' }).fill(title);
      await typeTitleFormattedAsHeading(page, `${title} heading`, 'Heading 1');
      await page.getByRole('textbox', { name: 'Summary *' }).fill('Required-only summary');
      await saveAndWaitForNodePage(page);

      // THEN the page saves and the User is on the FE of the created page, with the H1 as set
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: `${title} heading` })).toBeVisible();
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
