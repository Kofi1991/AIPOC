// case: TC-1578407
// spec: specs/tc-1578403-1578410-resource-and-collection-plan.md
// seed: tests/seed.spec.ts
// NOTE: "additional content type" is the Resource Collection type (/node/add/resource_collection)
// — the case's own step 2 says "Create a new Resouce Collection page", see plan Drift.
// NOTE: excludes step 5 (Site Admin) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const {
  openContentForm, pickMediaForField, fillResourceReference, saveAndClose, saveAndWaitForNodePage,
  expectBlankSubmitBlockedByBrowser, createResource, deleteQuietly,
} = require('../../helpers/contentTypeHelper');

test.describe('Resource Collection Validation (BBD)', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify mandatory fields on additional content type creation', async ({ page }) => {
    test.setTimeout(150_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Resource for the Resources autocomplete to reference
    const resourceTitle = `Probe resource for collection ${Date.now()}`;
    await openContentForm(page, 'resource');
    await createResource(page, { title: resourceTitle });

    const collectionTitle = `Resource collection mandatory role ${Date.now()}`;
    try {
      // Step 1: Title and Resources indicate they are required
      await openContentForm(page, 'resourceCollection');
      const titleField = page.getByRole('textbox', { name: 'Title *' });
      const resourcesField = page.getByRole('textbox', { name: /^Resources \(value 1\)/ });
      await expect(titleField).toBeVisible();
      await expect(resourcesField).toBeVisible();

      // Step 2: skip the required fields, complete only the optional ones, Save & Close
      await pickMediaForField(page, 'Thumbnail');
      await page.getByRole('combobox', { name: 'Language' }).selectOption({ index: 1 });
      await page.getByRole('group', { name: 'Category' }).getByRole('checkbox').first().check();
      await page.getByRole('combobox', { name: 'Resource type' }).selectOption({ index: 1 });
      await page.getByRole('combobox', { name: 'Resource format' }).selectOption({ index: 1 });
      await expectBlankSubmitBlockedByBrowser(page, [titleField, resourcesField]);

      // Steps 3-4: start clean, complete only the required fields, Save & Close
      await openContentForm(page, 'resourceCollection');
      await titleField.fill(collectionTitle);
      await fillResourceReference(page, resourceTitle);
      await saveAndWaitForNodePage(page);

      // THEN the page saves and the User is on the FE of the created page
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: collectionTitle })).toBeVisible();
    } finally {
      await deleteQuietly(page, collectionTitle);
      await deleteQuietly(page, resourceTitle);
    }
  });
});
