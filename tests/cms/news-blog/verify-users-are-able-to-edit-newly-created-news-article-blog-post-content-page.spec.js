// spec: specs/tc-1578362-1578374-news-article-blog-post-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes case steps 3-4 (Site Admin) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.

const { test, expect } = require('@playwright/test');
const { login, logout, navigateToBlogCreation, dismissAutosaveDialog } = require('../../helpers/authHelper');
const { createBlogPost } = require('../../helpers/blogPostHelper');
const {
  editContentItemFromList,
  filterContentListByTitle,
  deleteContentItemFromList,
} = require('../../helpers/contentPageHelper');

test.describe('News Article / Blog Post Editing', { tag: ['@smoke', '@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify Users Are Able to Edit Newly Created News Article/ Blog Post Content Page', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN a News Article/ Blog Post has been created (precondition)
    const title = `Blog post to edit ${Date.now()}`;
    const newTitle = `${title} EDITED`;
    await navigateToBlogCreation(page);
    await createBlogPost(page, { title, summary: 'Original summary' });
    await expect(page).not.toHaveURL(/\/node\/add\//);

    let currentTitle = title;
    try {
      // WHEN the User searches the CMS for it AND edits and saves the page
      await editContentItemFromList(page, title);
      await dismissAutosaveDialog(page);
      await page.getByRole('textbox', { name: 'Title *' }).fill(newTitle);
      await page.getByRole('button', { name: 'Save & Close' }).first().click();
      await expect(page).toHaveURL(/\/admin\/content/);
      currentTitle = newTitle;

      // THEN the changes are reflected — in the CMS list, and on the page itself
      const rows = await filterContentListByTitle(page, newTitle);
      await expect(rows).toHaveCount(1);
      await rows.getByRole('link', { name: newTitle, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1, name: newTitle })).toBeVisible();
    } finally {
      await deleteContentItemFromList(page, currentTitle);
    }
  });
});
