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
const { createBlogPost } = require('../../helpers/blogPostHelper');

test.describe('News Article / Blog Post Editing (BBD)', { tag: ['@smoke', '@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify users are able to edit News Articles / Blog Posts', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    const title = `News edit role ${Date.now()}`;
    const newTitle = `${title} EDITED`;
    const bodyText = `Edited body text ${Date.now()}`;
    await navigateToBlogCreation(page);
    await createBlogPost(page, { title, summary: 'Original summary' });

    let current = title;
    try {
      // Step 1: select to edit the newly created post
      await editContentItemFromList(page, title);
      await dismissAutosaveDialog(page);
      await expect(page).toHaveURL(/\/node\/\d+\/edit/);

      // Steps 2-4: add Body text and an Author, add a Paragraph, change the Title, Save & Close
      await setRichTextBody(page, `<p>${bodyText}</p>`);
      const author = page.getByRole('combobox', { name: 'Author' });
      await author.selectOption({ index: 1 });
      const authorName = (await author.locator('option:checked').innerText()).split(',')[0].trim();
      const paragraphText = `Paragraph text ${Date.now()}`;
      await addTextParagraph(page, `<p>${paragraphText}</p>`);
      await page.getByRole('textbox', { name: 'Title *' }).fill(newTitle);
      await saveAndClose(page);
      await expect(page).toHaveURL(/\/admin\/content/);
      current = newTitle;

      // Step 5: the edited content shows on the FE
      await openNodePageFromList(page, newTitle);
      await expect(page.getByText(paragraphText)).toBeVisible();
      await expect(page.getByText(bodyText)).toBeVisible();
      await expect(page.getByRole('main')).toContainText(authorName);
      await expect(page.getByRole('heading', { level: 1, name: newTitle })).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(`/blogs-and-news/${slugify(newTitle)}`);
    } finally {
      await deleteQuietly(page, current);
    }
  });
});
