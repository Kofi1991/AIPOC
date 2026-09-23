// spec: specs/tc-1578362-1578374-news-article-blog-post-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { login, logout, navigateToBlogCreation } = require('../../helpers/authHelper');
const { createBlogPost } = require('../../helpers/blogPostHelper');
const { deleteContentItemFromList } = require('../../helpers/contentPageHelper');

test.describe('News Article / Blog Post Required Fields', { tag: ['@smoke', '@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That All Required Specs Is Displayed When Creating A News Article/ Blog Post Page', async ({ page }) => {
    test.setTimeout(120_000); // includes the media-library modal

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new News Article/ Blog Post
    await navigateToBlogCreation(page);

    // AND the fields are visible — the asterisk in each accessible name marks it mandatory
    // (Title, Summary and Type per the case; Image too, see the plan's Drift).
    await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Summary *' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Type *' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Image *' })).toBeVisible();
    // AND the body field is optional: it is shown without an asterisk and can be left empty
    await expect(page.getByRole('application', { name: 'Rich Text Editor' })).toBeVisible();

    // THEN the User will be able to create a News Article/ Blog Post, with Body left empty
    const title = `Blog post required fields ${Date.now()}`;
    try {
      await createBlogPost(page, { title, summary: 'Summary for the required fields test' });
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    } finally {
      await deleteContentItemFromList(page, title);
    }
  });
});
