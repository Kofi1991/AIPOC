const { expect } = require('@playwright/test');
const { dismissAutosaveDialog } = require('./authHelper');
const { setRichTextBody, filterContentListByTitle, deleteContentItemFromList } = require('./contentPageHelper');
const { BASE_URL, url } = require('./siteConfig');

const SITE = BASE_URL;

const ADD_PATHS = {
  homepage: '/node/add/homepage',
  landing: '/node/add/landing_page',
  resource: '/node/add/resource',
};

// Opens the create form for a content type straight from its /node/add/<type> URL.
async function openContentForm(page, type) {
  await page.goto(SITE + ADD_PATHS[type], { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: /^Create / })).toBeVisible();
  await dismissAutosaveDialog(page);
}

// Fills a media-library field ("Add media" > pick the first library item > Insert selected).
// Waits for the field to report the selection before returning, because Drupal inserts the
// choice via AJAX and saving straight away submits the form before the field is filled.
async function pickMediaForField(page, groupName) {
  const group = page.getByRole('group', { name: groupName });
  await group.getByRole('button', { name: 'Add media' }).click();
  const dialog = page.getByRole('dialog');
  const firstItem = dialog.getByRole('checkbox', { name: /^Select / }).first();
  await firstItem.waitFor({ timeout: 20000 });
  await firstItem.check();
  await dialog.getByRole('button', { name: /Insert selected/i }).click();
  await expect(dialog).toBeHidden();
  await expect(group.getByRole('button', { name: 'Add media' })).not.toBeVisible({ timeout: 10000 }).catch(() => {});
  await expect(group.getByRole('button', { name: /^Remove/ }).first()).toBeVisible();
}

async function saveAndClose(page) {
  await page.getByRole('button', { name: 'Save & Close' }).first().click();
}

// Saves and waits for Drupal to leave the create form (it lands on the new node's own page).
async function saveAndWaitForNodePage(page) {
  await saveAndClose(page);
  await page.waitForURL((url) => !url.pathname.startsWith('/node/add'), { timeout: 20000 });
}

// Homepage: "Title formatted" is a CKEditor field (required) that sets the visible H1.
async function createHomepage(page, { title, titleFormatted = title, summary }) {
  await page.getByRole('textbox', { name: 'Title *' }).fill(title);
  await setRichTextBody(page, `<h1>${titleFormatted}</h1>`);
  await page.getByRole('textbox', { name: 'Summary *' }).fill(summary);
  await saveAndWaitForNodePage(page);
}

// Types the Homepage "Title formatted" text and picks a heading level from the editor's
// top-left "Paragraph, Heading" dropdown, the way an editor does it (case TC-1578391 step 3).
async function typeTitleFormattedAsHeading(page, text, headingLabel = 'Heading 1') {
  const editor = page.getByRole('textbox', { name: /Rich Text Editor/ });
  await editor.click();
  await editor.pressSequentially(text);
  await page.getByRole('button', { name: 'Paragraph, Heading' }).click();
  await page.getByRole('menuitemradio', { name: headingLabel }).click();
}

// Counts the paragraph rows currently in Content Sections. Each added component becomes one
// draggable row, whatever its type.
function paragraphRows(page) {
  return page.locator('table[id*="content-sections"] tr.draggable');
}

// Opens the Content Sections "Add Paragraph" picker and selects a component by name.
// The picker renders two nested dialogs sharing the "Add Paragraph" name, hence .last().
// The subform arrives over AJAX, so this waits for a new paragraph row to land. (Waiting on
// the CKEditor count instead would hang for components that have no rich text field at all,
// e.g. "Documents", which is only a media picker.)
async function addParagraph(page, type) {
  const before = await paragraphRows(page).count();
  await page.getByRole('button', { name: 'Add Paragraph' }).click();
  await page
    .getByRole('dialog', { name: 'Add Paragraph' })
    .last()
    .getByRole('button', { name: type, exact: true })
    .click();
  await expect(paragraphRows(page)).toHaveCount(before + 1, { timeout: 20000 });
}

// Sets a CKEditor field by its Drupal field name (e.g. 'field_accordion_items'), rather than
// by "the newest instance" — a form can hold several editors (the node Body, a paragraph's
// description, a nested item's description) and position is not a reliable way to tell them apart.
async function setEditorByFieldName(page, fieldNameFragment, html) {
  await page.evaluate(
    ({ fragment, value }) => {
      const match = Array.from(window.Drupal.CKEditor5Instances.values()).find((instance) =>
        (instance.sourceElement?.name || '').includes(fragment)
      );
      if (!match) throw new Error(`No CKEditor field matching "${fragment}"`);
      match.setData(value);
    },
    { fragment: fieldNameFragment, value: html }
  );
}

// Fills the node's own Title. Like the CTA above, this is targeted by field name: paragraph
// subforms (an accordion item, for instance) have their own required "Title *" field, so the
// role-based locator stops being unique as soon as one is added.
async function fillNodeTitle(page, title) {
  await page.locator('input[name="title[0][value]"]').fill(title);
}

// Fills the node's own CTA field (Landing page). Targeted by field name rather than by role:
// several paragraph components carry their own "CTA" group, so once one has been added
// getByRole('group', { name: 'CTA' }) matches more than one and the role-based locator is
// ambiguous. `field_cta[0]` is unambiguously the node-level field.
async function fillCta(page, { url: href, linkText }) {
  await page.locator('input[name="field_cta[0][uri]"]').fill(href);
  await page.locator('input[name="field_cta[0][title]"]').fill(linkText);
}

// Adds a "Documents" paragraph and attaches a file from the media library. The component has
// no required fields and no rich text — just the "Media upload" picker.
async function addDocumentsParagraph(page) {
  await addParagraph(page, 'Documents');
  await pickMediaForField(page, 'Media upload');
}

// Adds a "Text" paragraph (offered on every content type's Content Sections, unlike the
// type-specific ones) and fills its rich text editor. The newest CKEditor instance is the
// one just added, so set that one rather than the page's Body editor.
async function addTextParagraph(page, html) {
  await addParagraph(page, 'Text');
  await page.waitForFunction(() => window.Drupal.CKEditor5Instances.size > 0);
  await page.evaluate((h) => {
    const instances = Array.from(window.Drupal.CKEditor5Instances.values());
    instances[instances.length - 1].setData(h);
  }, html);
}

async function createLandingPage(page, { title, summary }) {
  await page.getByRole('textbox', { name: 'Title *' }).fill(title);
  await page.getByRole('textbox', { name: 'Summary *' }).fill(summary);
  await saveAndWaitForNodePage(page);
}

// Resource: Title and "Resource download" are required; everything else is optional.
async function createResource(page, { title, summary }) {
  await page.getByRole('textbox', { name: 'Title *' }).fill(title);
  if (summary) await page.getByRole('textbox', { name: 'Summary' }).fill(summary);
  await pickMediaForField(page, 'Resource download *');
  await saveAndWaitForNodePage(page);
}

// Clicks Save & Close with the given fields left blank and confirms the browser's native
// required-field validation blocked it: still on the form, each field :invalid with the
// browser's "Please fill out/in this field." message. The message is a tooltip outside the
// DOM, so :invalid + validationMessage is the reliable check.
async function expectBlankSubmitBlockedByBrowser(page, fields) {
  const formUrl = page.url();
  await saveAndClose(page);
  await expect(page).toHaveURL(formUrl);
  for (const field of fields) {
    expect(await field.evaluate((el) => el.matches(':invalid')), 'field should be :invalid').toBe(true);
    expect(await field.evaluate((el) => el.validationMessage)).toMatch(/please fill (out|in) this field\.?/i);
  }
}

// The URL alias Drupal generates from a title (pathauto): lower-case, punctuation to hyphens,
// and short "stop words" such as "to" and "the" dropped (e.g. "Homepage to edit" -> "homepage-edit").
const PATHAUTO_STOP_WORDS = new Set(['a', 'an', 'as', 'at', 'before', 'but', 'by', 'for', 'from', 'is', 'in', 'into', 'like', 'of', 'off', 'on', 'onto', 'per', 'since', 'than', 'the', 'this', 'that', 'to', 'up', 'via', 'with']);
function slugify(title) {
  return title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !PATHAUTO_STOP_WORDS.has(word))
    .join('-');
}

// Opens the item's own page by clicking its title in the CMS content list (filtered by title).
async function openNodePageFromList(page, title) {
  const rows = await filterContentListByTitle(page, title);
  await rows.getByRole('link', { name: title, exact: true }).click();
  await page.waitForLoadState('domcontentloaded');
}

// Best-effort cleanup for a `finally` block: never lets a failed cleanup mask the real result.
async function deleteQuietly(page, title) {
  try {
    await deleteContentItemFromList(page, title);
  } catch (e) {
    console.log(`cleanup: could not delete "${title}": ${e.message.split('\n')[0]}`);
  }
}

module.exports = {
  SITE,
  slugify,
  openNodePageFromList,
  deleteQuietly,
  openContentForm,
  pickMediaForField,
  saveAndClose,
  saveAndWaitForNodePage,
  createHomepage,
  typeTitleFormattedAsHeading,
  addParagraph,
  fillCta,
  fillNodeTitle,
  setEditorByFieldName,
  addDocumentsParagraph,
  addTextParagraph,
  createLandingPage,
  createResource,
  expectBlankSubmitBlockedByBrowser,
};
