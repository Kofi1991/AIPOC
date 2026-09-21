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

test.describe('News Article / Blog Post Validation (BBD)', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify mandatory fields on News Article / Blog Post creation', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Step 1: Title, Summary, Image and Type indicate they are required
    await navigateToBlogCreation(page);
    const titleField = page.getByRole('textbox', { name: 'Title *' });
    const summaryField = page.getByRole('textbox', { name: 'Summary *' });
    await expect(titleField).toBeVisible();
    await expect(summaryField).toBeVisible();
    await expect(page.getByRole('group', { name: 'Image *' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Type *' })).toBeVisible();

    // Step 2: skip the required fields, complete only the optional Body and Author, Save & Close
    await setRichTextBody(page, '<p>Optional body text</p>');
    await page.getByRole('combobox', { name: 'Author' }).selectOption({ index: 1 });
    await expectBlankSubmitBlockedByBrowser(page, [titleField, summaryField]);

    // Steps 3-4: start clean, complete Title and Summary only. The Image is mandatory too (the case
    // omits it — see plan Drift), so the save is rejected until an Image is added.
    await navigateToBlogCreation(page);
    const title = `News mandatory role ${Date.now()}`;
    const summary = 'Required-only summary';
    try {
      await titleField.fill(title);
      await summaryField.fill(summary);
      await saveAndClose(page);
      await expect(page.getByText('Image field is required.').first()).toBeVisible();
      await expect(page).toHaveURL(/\/node\/add\/news_article_blog_post/);

      // With the Image added the page saves and the User is on the FE of the created page
      await createBlogPost(page, { title, summary });
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
