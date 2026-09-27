// case: TC-1578405
// spec: specs/tc-1578403-1578410-resource-and-collection-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes step 6 (Site Admin repeat) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.
// NOTE: step 4 ("redirected to FE") does not hold — Save & Close returns to /admin/content, see
// plan Drift. Thumbnail image and Category are added but genuinely do not render on the FE
// (the case itself says "This is fine for this test") and are not asserted.

const { test, expect } = require('@playwright/test');
const { login, logout, dismissAutosaveDialog } = require('../../helpers/authHelper');
const { editContentItemFromList, setRichTextBody } = require('../../helpers/contentPageHelper');
const {
  openContentForm, createResource, pickMediaForField, addDocumentsParagraph, saveAndClose,
  openNodePageFromList, fillNodeTitle, slugify, deleteQuietly,
} = require('../../helpers/contentTypeHelper');

test.describe('Resource Editing (BBD)', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify users are able to edit Resource pages', async ({ page }) => {
    test.setTimeout(150_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Resource created with Title and Summary
    const title = `Resource edit role ${Date.now()}`;
    const newTitle = `${title} EDITED`;
    const bodyText = `Edited body text ${Date.now()}`;
    await openContentForm(page, 'resource');
    await createResource(page, { title, summary: 'Original summary' });

    let current = title;
    try {
      // Step 1: select to Edit the newly created Resource
      await editContentItemFromList(page, title);
      await dismissAutosaveDialog(page);

      // Step 2: add a Documents paragraph (a component not used by the Resource create spec),
      // plus Thumbnail image, Body, Language, Category, Resource type and Resource format
      await addDocumentsParagraph(page);
      await pickMediaForField(page, 'Thumbnail image');
      await setRichTextBody(page, `<p>${bodyText}</p>`);
      await page.getByRole('combobox', { name: 'Language' }).selectOption({ label: 'Polish' });
      await page.getByRole('group', { name: 'Category' }).getByRole('checkbox').first().check();
      const typeField = page.getByRole('combobox', { name: 'Resource type' });
      const formatField = page.getByRole('combobox', { name: 'Resource format' });
      await typeField.selectOption({ index: 1 });
      await formatField.selectOption({ index: 1 });
      const typeLabel = await typeField.locator('option:checked').innerText();
      const formatLabel = await formatField.locator('option:checked').innerText();

      // Step 3: adjust the Title
      await fillNodeTitle(page, newTitle);

      // Step 4: Save & Close — lands on /admin/content, not the FE (see Drift)
      await saveAndClose(page);
      await expect(page).toHaveURL(/\/admin\/content/);
      current = newTitle;

      // Step 5: the edited content shows on the FE
      await openNodePageFromList(page, newTitle);
      await expect(page.getByRole('heading', { level: 1, name: newTitle })).toBeVisible();
      await expect(page.getByText(bodyText)).toBeVisible();
      await expect(page.getByText('Polish')).toBeVisible();
      await expect(page.getByText(typeLabel)).toBeVisible();
      await expect(page.getByText(formatLabel)).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(`/resources/${slugify(newTitle)}`);
    } finally {
      await deleteQuietly(page, current);
    }
  });
});
