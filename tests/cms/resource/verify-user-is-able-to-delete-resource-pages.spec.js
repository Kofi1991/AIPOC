// case: TC-1578406
// spec: specs/tc-1578403-1578410-resource-and-collection-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes steps 3-4 (second node / Site Admin repeat) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const {
  expectContentItemInList, expectContentItemAbsentFromList, deleteContentItemFromList,
} = require('../../helpers/contentPageHelper');
const { openContentForm, createResource } = require('../../helpers/contentTypeHelper');

test.describe('Resource Deletion (BBD)', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify user is able to delete Resource pages', async ({ page }) => {
    test.setTimeout(90_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Resource to delete
    const title = `Resource to delete role ${Date.now()}`;
    await openContentForm(page, 'resource');
    await createResource(page, { title });
    await expectContentItemInList(page, title);

    // Step 1: the dropdown next to Edit > Delete > confirm with Save & Close
    await deleteContentItemFromList(page, title);

    // Step 2: the node is deleted and no longer visible — checked in the CMS
    await expectContentItemAbsentFromList(page, title);
  });
});
