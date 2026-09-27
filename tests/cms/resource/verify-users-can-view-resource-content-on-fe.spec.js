// case: TC-1578404
// spec: specs/tc-1578403-1578410-resource-and-collection-plan.md
// seed: tests/seed.spec.ts
// NOTE: the accessibility checks in step 5 (hover/focus/selected states) are not automated —
// the case's own author already found and waived the missing focus box, see plan Drift.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const { openContentForm, createResource, slugify, deleteQuietly } = require('../../helpers/contentTypeHelper');

test.describe('Resource Front End', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify users can view Resource content on FE', async ({ page }) => {
    test.setTimeout(90_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Resource created with only Title and Resource download
    const title = `Resource view ${Date.now()}`;
    await openContentForm(page, 'resource');
    try {
      await createResource(page, { title });

      // THEN the Title appears as an H1 and a download link is present
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.getByRole('link', { name: /download/i })).toBeVisible();

      // AND the URL extension matches the Title
      expect(new URL(page.url()).pathname).toBe(`/resources/${slugify(title)}`);
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
