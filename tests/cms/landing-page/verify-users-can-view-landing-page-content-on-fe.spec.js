// case: TC-1578396
// spec: specs/tc-1578395-1578398-landing-page-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const { openContentForm, createLandingPage, slugify, deleteQuietly } = require('../../helpers/contentTypeHelper');

test.describe('Landing Page Front End', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify users can view Landing Page content on FE', async ({ page }) => {
    test.setTimeout(90_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Landing Page created with only the required fields
    const title = `Landing view ${Date.now()}`;
    const summary = 'Summary shown on the landing page front end';
    await openContentForm(page, 'landing');
    try {
      await createLandingPage(page, { title, summary });

      // THEN only Title and Summary display: Title as an H1, Summary as text
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.getByText(summary)).toBeVisible();

      // AND the URL extension matches the Title
      expect(new URL(page.url()).pathname).toBe(`/${slugify(title)}`);
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
