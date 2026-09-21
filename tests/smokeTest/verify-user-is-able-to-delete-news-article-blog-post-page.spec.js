// spec: specs/tc-1578362-1578374-news-article-blog-post-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes case step 2 (Site Admin) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.

const { test, expect } = require('@playwright/test');
const { login, logout, navigateToBlogCreation } = require('../helpers/authHelper');
const { createBlogPost } = require('../helpers/blogPostHelper');
const {
  deleteContentItemFromList,
  expectContentItemInList,
  expectContentItemAbsentFromList,
} = require('../helpers/contentPageHelper');

test.describe('News Article / Blog Post Deletion', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify User Is Able To Delete News Article/ Blog Post Page', async ({ page }) => {
    test.setTimeout(90_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: an existing News Article/ Blog Post to delete
    const title = `Blog post to delete ${Date.now()}`;
    await navigateToBlogCreation(page);
    await createBlogPost(page, { title, summary: 'Automated summary for delete test' });
    await expect(page).not.toHaveURL(/\/node\/add\//);
    // Positive control: the lookup used below must find it first
    await expectContentItemInList(page, title);

    // WHEN the User views the Content list AND deletes the existing page
    await deleteContentItemFromList(page, title);

    // THEN the selected page will be deleted — checked in the CMS itself, not via the
    // session-stored "has been deleted" message.
    await expectContentItemAbsentFromList(page, title);
  });
});
