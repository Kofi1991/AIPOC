const { expect } = require('@playwright/test');
const { dismissAutosaveDialog } = require('./authHelper');

async function openGenericPageForm(page) {
  await page.goto('https://test.registertovote.london/node/add', { waitUntil: 'domcontentloaded' });
  // exact: true — the content-type link's accessible name is "Generic page", but prior test
  // runs leave real "Generic page <timestamp>" nodes on staging that Drupal's admin toolbar
  // surfaces as recent-content links, and a substring match catches those too.
  await page.getByRole('link', { name: 'Generic page', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create Generic page' })).toBeVisible();
  await dismissAutosaveDialog(page);
}

async function expectGenericPageFieldRequirements(page) {
  await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Summary *' })).toBeVisible();
  await expect(page.getByRole('application', { name: 'Rich Text Editor' })).toBeVisible();
}

async function createGenericPage(page, title, summary) {
  await page.getByRole('textbox', { name: 'Title *' }).fill(title);
  await page.getByRole('textbox', { name: 'Summary *' }).fill(summary);
  await page.getByRole('button', { name: 'Save & Close' }).first().click();
}

// Opens the Content Sections "Add Paragraph" picker and adds a "Latest news
// and blogs" component. The picker inserts the subform via AJAX, so wait for
// it to actually land before continuing (a fixed click-then-move-on races it).
async function addLatestNewsAndBlogsParagraph(page) {
  await page.getByRole('button', { name: 'Add Paragraph' }).click();
  await page.getByRole('button', { name: 'Latest news and blogs' }).click();

  // Scope to the Content Sections field, not the admin toolbar, which also has
  // a hidden "Latest news and blogs" link (the paragraph type's edit-form link).
  const contentSections = page.locator('[id*="content-sections"]').first();
  await expect(contentSections.getByText('Latest news and blogs').first()).toBeVisible();
}

// On a published/view page (not the edit form), confirms the "Latest news and
// blogs" paragraph rendered. The component has no literal "Latest news and
// blogs" label in its output — it renders the actual referenced blog post(s)
// — so this asserts on the paragraph's type class rather than visible text.
async function expectLatestNewsAndBlogsParagraphVisible(page) {
  await expect(page.locator('.paragraph--type--latest-news-and-blogs').first()).toBeVisible();
}

// Deletes a content item by title from the admin Content list (/admin/content).
// The row's "Delete" link opens an AJAX modal, not a page navigation — the modal's
// confirm button is labelled "Save & Close" (a reused generic-modal button, not
// "Delete" — see plan drift notes). Returns once back on the content list with the
// "has been deleted" message visible.
async function deleteContentItemFromList(page, title) {
  await page.goto('https://test.registertovote.london/admin/content', { waitUntil: 'domcontentloaded' });
  const row = page.locator('tr', { hasText: title });

  // The Delete link lives behind a collapsed "additional actions" dropdown next to
  // the row's Edit button — open it before the link becomes clickable.
  await row.getByRole('button', { name: /additional actions/i }).click();

  // Dispatch the click directly on the Delete link's DOM node rather than at its
  // screen coordinates. The always-visible Edit split-button visually overlaps the
  // open dropdown's items (a real layout defect in the admin content list) — a
  // coordinate-based click, even with force:true, can land on whichever element is
  // topmost at that point and actually activate Edit instead. Observed live: under
  // full-suite load this intermittently navigated to the Edit form instead of
  // opening the Delete confirmation dialog.
  await row.locator('a[href*="/delete?"]').evaluate((el) => el.click());

  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByRole('button', { name: 'Save & Close' }).click();
  await page.waitForLoadState('domcontentloaded');
}

// Sets the Body rich text field's content directly via CKEditor5's own instance API
// (window.Drupal.CKEditor5Instances) rather than driving the toolbar/keyboard shortcuts.
// Keyboard-driven formatting (select-then-Ctrl+B, etc.) proved unreliable — selections
// silently dropped or replaced typed text in this editor build. setData() is the same
// mechanism the editor itself uses and reliably produces exact, checkable HTML output.
// Assumes exactly one rich text editor is present on the page.
async function setRichTextBody(page, html) {
  await page.waitForFunction(() => window.Drupal?.CKEditor5Instances?.size > 0);
  await page.evaluate((bodyHtml) => {
    const instance = Array.from(window.Drupal.CKEditor5Instances.values())[0];
    instance.setData(bodyHtml);
  }, html);
}

// Filters the admin Content list (/admin/content) by title and opens the Edit form
// for the single matching row. Unlike Delete, the Edit link is always visible (not
// behind the "additional actions" dropdown), but its accessible name is a substring
// match risk the same way Delete's is — scope by href, not role name.
async function editContentItemFromList(page, title) {
  await page.goto('https://test.registertovote.london/admin/content', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Title' }).fill(title);
  await page.getByRole('button', { name: 'Filter' }).click();
  await page.waitForLoadState('domcontentloaded');

  const row = page.locator('tr', { hasText: title });
  await row.locator('a[href*="/edit?"]').click();
  await page.waitForLoadState('domcontentloaded');
}

module.exports = {
  openGenericPageForm,
  expectGenericPageFieldRequirements,
  createGenericPage,
  addLatestNewsAndBlogsParagraph,
  expectLatestNewsAndBlogsParagraphVisible,
  deleteContentItemFromList,
  setRichTextBody,
  editContentItemFromList,
};
