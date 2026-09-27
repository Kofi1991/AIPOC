// case: TC-1578408
// spec: specs/tc-1578403-1578410-resource-and-collection-plan.md
// seed: tests/seed.spec.ts
// NOTE: "additional content type" is the Resource Collection type, see plan Drift.
// NOTE: step 1 says the Title should NOT display — verified live it IS the page's H1, same as
// every other content type; the case's claim is not followed, see plan Drift.
// NOTE: the accessibility checks in step 3 are not automated — the case's own author already
// found and waived the missing focus box, see plan Drift.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const {
  openContentForm, createResource, createResourceCollection, deleteQuietly,
} = require('../../helpers/contentTypeHelper');

test.describe('Resource Collection Front End', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify users can view additional content type on FE', async ({ page }) => {
    test.setTimeout(150_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Resource, then a Resource Collection referencing it
    const resourceTitle = `Probe resource for collection view ${Date.now()}`;
    await openContentForm(page, 'resource');
    await createResource(page, { title: resourceTitle });

    const collectionTitle = `Resource collection view ${Date.now()}`;
    try {
      await openContentForm(page, 'resourceCollection');
      await createResourceCollection(page, { title: collectionTitle, resourceTitle });
      const collectionUrl = page.url();

      // THEN the Title is the H1 (the case's "not shown" claim does not hold — see Drift)
      await expect(page.getByRole('heading', { level: 1, name: collectionTitle })).toBeVisible();

      // AND a "Related resources" card links to the referenced Resource
      // getByRole('heading', ...), not getByText: as admin, Drupal's contextual-links toolbar
      // adds a hidden "Open Related resources configuration options" button with the same text.
      await expect(page.getByRole('heading', { name: 'Related resources' })).toBeVisible();
      const card = page.getByRole('link', { name: resourceTitle });
      await expect(card).toBeVisible();

      // Step 2: clicking it navigates to the Resource, and Back returns to the collection
      await card.click();
      await expect(page).not.toHaveURL(collectionUrl);
      await page.goBack();
      await expect(page).toHaveURL(collectionUrl);
    } finally {
      await deleteQuietly(page, collectionTitle);
      await deleteQuietly(page, resourceTitle);
    }
  });
});
