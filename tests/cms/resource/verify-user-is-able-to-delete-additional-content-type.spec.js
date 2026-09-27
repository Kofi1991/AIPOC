// case: TC-1578410
// spec: specs/tc-1578403-1578410-resource-and-collection-plan.md
// seed: tests/seed.spec.ts
// NOTE: "additional content type" is the Resource Collection type, see plan Drift.
// NOTE: excludes steps 3-4 (second node / Site Admin repeat) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const {
  expectContentItemInList, expectContentItemAbsentFromList, deleteContentItemFromList,
} = require('../../helpers/contentPageHelper');
const {
  openContentForm, createResource, createResourceCollection, deleteQuietly,
} = require('../../helpers/contentTypeHelper');

test.describe('Resource Collection Deletion (BBD)', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify user is able to delete additional content type', async ({ page }) => {
    test.setTimeout(150_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Resource, then a Resource Collection referencing it
    const resourceTitle = `Probe resource for collection delete ${Date.now()}`;
    await openContentForm(page, 'resource');
    await createResource(page, { title: resourceTitle });

    const collectionTitle = `Resource collection to delete role ${Date.now()}`;
    try {
      await openContentForm(page, 'resourceCollection');
      await createResourceCollection(page, { title: collectionTitle, resourceTitle });
      await expectContentItemInList(page, collectionTitle);

      // Step 1: the dropdown next to Edit > Delete > confirm with Save & Close
      await deleteContentItemFromList(page, collectionTitle);

      // Step 2: the node is deleted and no longer visible — checked in the CMS
      await expectContentItemAbsentFromList(page, collectionTitle);
    } finally {
      await deleteQuietly(page, resourceTitle);
    }
  });
});
