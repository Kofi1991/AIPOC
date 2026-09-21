// spec: specs/tc-1578362-1578374-news-article-blog-post-plan.md
// seed: tests/seed.spec.ts
// NOTE: case step 2 (Summary not shown on the homepage) is not automated — see the plan's Drift.
// The image caption in step 3 is not asserted either: no caption exists on the page.

const { test, expect } = require('@playwright/test');
const { login, logout, navigateToBlogCreation } = require('../helpers/authHelper');
const { createBlogPost } = require('../helpers/blogPostHelper');
const { deleteContentItemFromList } = require('../helpers/contentPageHelper');

test.describe('News Article / Blog Post Creation', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That Users Are Able To Create  News Article/ Blog Post Content Page', async ({ page }) => {
    test.setTimeout(90_000);

    // GIVEN a user is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new News Article/ Blog Post AND fills in the fields
    await navigateToBlogCreation(page);
    const title = `News article to create ${Date.now()}`;
    try {
      await createBlogPost(page, { title, summary: 'Automated summary for create test', type: 'News article' });

      // THEN the Page will be created and the User is taken to it
      await expect(page).not.toHaveURL(/\/node\/add\//);

      // WHEN viewing the created page THEN the Title appears as an H1 and the Image is shown
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.getByRole('main').getByRole('img').first()).toBeVisible();
      // The chosen Type is shown on the page too
      await expect(page.getByRole('main')).toContainText('News article');
    } finally {
      await deleteContentItemFromList(page, title);
    }
  });
});
