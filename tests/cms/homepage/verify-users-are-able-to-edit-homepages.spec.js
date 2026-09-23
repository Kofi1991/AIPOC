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

test.describe('Homepage Editing (BBD)', { tag: ['@smoke', '@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify users are able to edit Homepages', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Homepage whose Title Formatted is an H1
    const title = `Homepage edit role ${Date.now()}`;
    const newTitle = `${title} EDITED`;
    const formatted = `${title} formatted`;
    await openContentForm(page, 'homepage');
    await createHomepage(page, { title, titleFormatted: formatted, summary: 'Original summary' });

    let current = title;
    try {
      // Step 1: select to edit the newly created Homepage
      await editContentItemFromList(page, title);
      await dismissAutosaveDialog(page);
      await expect(page).toHaveURL(/\/node\/\d+\/edit/);

      // Steps 2-4: add a Paragraph component, change the Title, and reformat Title Formatted as a
      // plain Paragraph (not a heading), then Save & Close
      await addLatestNewsAndBlogsParagraph(page);
      await page.getByRole('textbox', { name: 'Title *' }).fill(newTitle);
      await setRichTextBody(page, `<p>${formatted}</p>`);
      await saveAndClose(page);
      await expect(page).toHaveURL(/\/admin\/content/);
      current = newTitle;

      // Step 5: the edited content shows on the FE
      await openNodePageFromList(page, newTitle);
      await expectLatestNewsAndBlogsParagraphVisible(page);
      await expect(page.getByText(formatted, { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { level: 1, name: formatted })).toHaveCount(0);
      expect(new URL(page.url()).pathname).toBe(`/${slugify(newTitle)}`);
    } finally {
      await deleteQuietly(page, current);
    }
  });
});
