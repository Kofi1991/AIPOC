// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: the Site Admin steps are not automated — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.
// NOTE: 'Edit button at top of screen' is reached via the row's Edit button in the content list.
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

test.describe('Generic Page Editing (BBD)', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify users are able to edit Generic Content Pages', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    const title = `Generic edit role ${Date.now()}`;
    const newTitle = `${title} version 2`;
    const summary = `Added summary ${Date.now()}`;
    await openGenericPageForm(page);
    await createGenericPage(page, title, 'Original summary');
    await page.waitForURL((url) => !url.pathname.startsWith('/node/add'));

    let current = title;
    try {
      // Steps 2-3: the new node is in the content list, and its title matches its URL extension
      await openNodePageFromList(page, title);
      expect(new URL(page.url()).pathname).toBe(`/${slugify(title)}`);

      // Steps 4-5: Edit, update the Title and the Summary, Save & Close
      await editContentItemFromList(page, title);
      await dismissAutosaveDialog(page);
      await page.getByRole('textbox', { name: 'Title *' }).fill(newTitle);
      await page.getByRole('textbox', { name: 'Summary *' }).fill(summary);
      await saveAndClose(page);
      await expect(page).toHaveURL(/\/admin\/content/);
      current = newTitle;

      // Step 6: the Title has the new text, the URL follows it, and the Summary is not shown on the FE
      await openNodePageFromList(page, newTitle);
      await expect(page.getByRole('heading', { level: 1, name: newTitle })).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(`/${slugify(newTitle)}`);
      await expect(page.getByText(summary)).toHaveCount(0);
    } finally {
      await deleteQuietly(page, current);
    }
  });
});
