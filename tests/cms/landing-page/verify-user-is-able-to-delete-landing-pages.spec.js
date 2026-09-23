// case: TC-1578398
// spec: specs/tc-1578395-1578398-landing-page-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes steps 3-4 (second node / Site Admin repeat) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const {
  expectContentItemInList, expectContentItemAbsentFromList, deleteContentItemFromList,
} = require('../../helpers/contentPageHelper');
const { openContentForm, createLandingPage } = require('../../helpers/contentTypeHelper');

test.describe('Landing Page Deletion (BBD)', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify user is able to delete Landing Pages', async ({ page }) => {
    test.setTimeout(90_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Landing Page to delete
    const title = `Landing to delete role ${Date.now()}`;
    await openContentForm(page, 'landing');
    await createLandingPage(page, { title, summary: 'Automated summary for delete test' });
    await expectContentItemInList(page, title);

    // Step 1: the dropdown next to Edit > Delete > confirm with Save & Close
    await deleteContentItemFromList(page, title);

    // Step 2: the node is deleted and no longer visible — checked in the CMS (the
    // "has been deleted" message lives in the shared Drupal session, so not asserted)
    await expectContentItemAbsentFromList(page, title);
  });
});
