const { expect } = require('@playwright/test');
const { dismissAutosaveDialog } = require('./authHelper');
const { setRichTextBody, filterContentListByTitle, deleteContentItemFromList } = require('./contentPageHelper');
const { BASE_URL, url } = require('./siteConfig');

const SITE = BASE_URL;

const ADD_PATHS = {
  homepage: '/node/add/homepage',
  landing: '/node/add/landing_page',
  resource: '/node/add/resource',
  resourceCollection: '/node/add/resource_collection',
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
// `scope` narrows the group lookup to a specific paragraph row rather than the whole page —
// needed once more than one paragraph is on the form, since group names aren't unique then.
async function pickMediaForField(page, groupName, scope = page) {
  const group = scope.getByRole('group', { name: groupName });
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
// draggable row, whatever its type. Scoped to DIRECT child rows of the outer table specifically
// — some components (Accordion items, Multi-card cards) have their own nested reorderable
// table one level down, and a plain descendant selector would double-count those too.
function paragraphRows(page) {
  return page.locator('table[id^="field-content-sections-values"] > tbody > tr.draggable');
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
  await pickMediaForField(page, 'Media upload', paragraphRows(page).last());
}

// Adds an "Accordion" paragraph and fills it. Only the accordion item's Title is required;
// the accordion's own heading and the item's description are optional. On the front end the
// item Title renders as a collapsed toggle button and the item description is its panel.
async function addAccordionParagraph(page, { heading, itemTitle, itemBody }) {
  await addParagraph(page, 'Accordion');
  // Captured immediately, so it's unambiguously *this* row even if more paragraphs are added
  // after it. Both the outer paragraph's own Title and the nested item's Title share the
  // "][field_title]" name fragment and the plain "Title" accessible name, so the outer one is
  // matched by excluding the nested item's distinguishing "accordion_items" fragment.
  const row = paragraphRows(page).last();
  if (heading) {
    await row.locator('input[name*="][field_title]"]:not([name*="accordion_items"])').fill(heading);
  }
  await row.locator('input[required][name*="field_accordion_items"][name*="field_title"]').fill(itemTitle);
  if (itemBody) {
    await setEditorByFieldName(page, 'field_accordion_items', `<p>${itemBody}</p>`);
  }
}

// Adds an "Image / video" paragraph: only the Media field is required.
async function addImageVideoParagraph(page, { title } = {}) {
  await addParagraph(page, 'Image / video');
  const row = paragraphRows(page).last();
  if (title) {
    await row.getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  }
  await pickMediaForField(page, 'Media *', row);
}

// Adds a "Call to action" paragraph. The only required field is Colour theme, a radio group
// that already defaults to "Light" — nothing to fill unless a real CTA link is wanted too.
async function addCallToActionParagraph(page, { title, ctaUrl, ctaLinkText } = {}) {
  await addParagraph(page, 'Call to action');
  const row = paragraphRows(page).last();
  if (title) await row.getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  if (ctaUrl) {
    const cta = row.getByRole('group', { name: 'CTA' });
    await cta.getByRole('textbox', { name: 'URL', exact: true }).fill(ctaUrl);
    await cta.getByRole('textbox', { name: 'Link text', exact: true }).fill(ctaLinkText || 'Learn more');
  }
}

// Adds a "Partners / logo listing paragraph" and attaches one logo from the media library —
// the only required field.
async function addPartnersLogoParagraph(page, { title } = {}) {
  await addParagraph(page, 'Partners / logo listing paragraph');
  const row = paragraphRows(page).last();
  if (title) {
    await row.getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  }
  await pickMediaForField(page, 'Partner / logo cards *', row);
}

// Adds an "Embed" paragraph and fills its required "Embed" field with a code snippet — the
// case itself supplies a YouTube iframe embed to use here.
async function addEmbedParagraph(page, embedHtml) {
  await addParagraph(page, 'Embed');
  await paragraphRows(page).last().getByRole('textbox', { name: /^Embed/ }).fill(embedHtml);
}

// Adds a "Dual column block" paragraph. Background colour is the only required field, and it
// already defaults to "Light" — the two columns themselves are optional (each is its own
// nested "Add Image / video" etc. picker), so this leaves them empty.
async function addDualColumnParagraph(page, { title } = {}) {
  await addParagraph(page, 'Dual column block');
  if (title) {
    await paragraphRows(page).last().getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  }
}

// Adds a "Multi-card block" paragraph. Drupal enforces "A minimum of 2 Paragraphs of type Card
// is allowed", so `cards` must have at least 2 entries — one Card ships by default, the rest
// are added via the row's own "Add Card" button. Each card's Image, Title and URL are required.
async function addMultiCardParagraph(page, cards) {
  await addParagraph(page, 'Multi-card block');
  const row = paragraphRows(page).last();
  const cardRows = row.locator('table[id^="field-card-block-values"] > tbody > tr.draggable');
  for (let i = 1; i < cards.length; i += 1) {
    await row.getByRole('button', { name: 'Add Card' }).click();
    await expect(cardRows).toHaveCount(i + 1, { timeout: 20000 });
  }
  for (let i = 0; i < cards.length; i += 1) {
    const cardRow = cardRows.nth(i);
    await pickMediaForField(page, 'Image *', cardRow);
    await cardRow.getByRole('textbox', { name: 'Title *', exact: true }).fill(cards[i].cardTitle);
    await cardRow.getByRole('textbox', { name: 'URL *', exact: true }).fill(cards[i].cardUrl);
  }
}

// Adds a "Chatbot CTA" paragraph. Title, Sub-title, Summary, the Chatbot link's URL and Link
// text, and CTA Text are all required.
async function addChatbotCtaParagraph(page, { title, subTitle, summary, linkUrl, linkText, ctaText }) {
  await addParagraph(page, 'Chatbot CTA');
  const row = paragraphRows(page).last();
  await row.getByRole('textbox', { name: 'Title *', exact: true }).fill(title);
  await row.getByRole('textbox', { name: 'Sub-title *', exact: true }).fill(subTitle);
  await row.getByRole('textbox', { name: 'Summary *', exact: true }).fill(summary);
  const chatbotLink = row.getByRole('group', { name: 'Chatbot link *' });
  await chatbotLink.getByRole('textbox', { name: 'URL *', exact: true }).fill(linkUrl);
  await chatbotLink.getByRole('textbox', { name: 'Link text *', exact: true }).fill(linkText);
  await row.getByRole('textbox', { name: 'CTA Text *', exact: true }).fill(ctaText);
}

// Adds a "Newsletter signup" paragraph. The required reference field already defaults to the
// "Newsletter signup" webform (the other option is "Contact"), so nothing to pick unless a
// different one is wanted.
async function addNewsletterSignupParagraph(page, { title } = {}) {
  await addParagraph(page, 'Newsletter signup');
  if (title) {
    await paragraphRows(page).last().getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  }
}

// Adds a "Resources menu" paragraph with one card. Title and Link are required; Image and
// Summary are optional.
async function addResourcesMenuParagraph(page, { cardTitle, cardLink }) {
  await addParagraph(page, 'Resources menu');
  const row = paragraphRows(page).last();
  await row.getByRole('textbox', { name: 'Title *', exact: true }).fill(cardTitle);
  await row.getByRole('textbox', { name: 'Link *', exact: true }).fill(cardLink);
}

// Adds a "Webform" paragraph. The Webform reference defaults to "- Select -" (blank), so a
// real webform must be chosen — "Contact" is one of the two available on this site.
async function addWebformParagraph(page, { webformLabel = 'Contact' } = {}) {
  await addParagraph(page, 'Webform');
  await paragraphRows(page).last().getByRole('combobox', { name: 'Webform *' }).selectOption({ label: webformLabel });
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

// The "Resources" field on a Resource Collection is an entity-reference autocomplete: type
// enough of an existing Resource's title to bring up the suggestion list, then click the
// match. There must already be a saved Resource with this title for a suggestion to appear.
async function fillResourceReference(page, resourceTitle) {
  const field = page.getByRole('textbox', { name: /^Resources \(value 1\)/ });
  await field.click();
  await field.pressSequentially(resourceTitle.slice(0, 40), { delay: 20 });
  const suggestion = page.locator('.ui-autocomplete li a, li.ui-menu-item, [role="option"]').first();
  await suggestion.waitFor({ timeout: 10000 });
  await suggestion.click();
}

// Resource Collection: Title and one Resources reference are required; everything else is
// optional. `resourceTitle` must be an already-saved Resource node's title.
async function createResourceCollection(page, { title, resourceTitle }) {
  await page.getByRole('textbox', { name: 'Title *' }).fill(title);
  await fillResourceReference(page, resourceTitle);
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
  paragraphRows,
  fillCta,
  fillNodeTitle,
  setEditorByFieldName,
  addDocumentsParagraph,
  addAccordionParagraph,
  addImageVideoParagraph,
  addCallToActionParagraph,
  addPartnersLogoParagraph,
  addEmbedParagraph,
  addDualColumnParagraph,
  addMultiCardParagraph,
  addChatbotCtaParagraph,
  addNewsletterSignupParagraph,
  addResourcesMenuParagraph,
  addWebformParagraph,
  addTextParagraph,
  createLandingPage,
  createResource,
  fillResourceReference,
  createResourceCollection,
  expectBlankSubmitBlockedByBrowser,
};
