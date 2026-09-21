// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: step 1 is a reusable step with no expected result in TestCollab, not automated.
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

test.describe('News Article / Blog Post Front End', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify users can view News Article / Blog Post content on FE', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    const title = `News on FE ${Date.now()}`;
    const summary = `News FE summary ${Date.now()}`;
    await navigateToBlogCreation(page);
    try {
      await createBlogPost(page, { title, summary, type: 'News article' });

      // Step 2: the Title, Summary, Image and Type display on the FE
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();  // Step 3: Title is an h1
      await expect(page.getByText(summary)).toBeVisible();
      await expect(page.getByRole('main').getByRole('img').first()).toBeVisible();
      await expect(page.getByRole('main')).toContainText('News article');

      // Step 4: the URL extension matches the Title
      expect(new URL(page.url()).pathname).toBe(`/blogs-and-news/${slugify(title)}`);
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
