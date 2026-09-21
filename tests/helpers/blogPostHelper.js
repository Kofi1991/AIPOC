const { expect } = require('@playwright/test');

async function fillBlogPostTitle(page, title) {
  const titleField = page.getByLabel(/title/i)
    .or(page.locator('input[name*="title"]'))
    .first();
  
  await titleField.fill(title);
  await expect(titleField).toHaveValue(title);
}

async function fillBlogPostSummary(page, summary) {
  const summaryField = page.getByLabel(/summary/i)
    .or(page.locator('textarea[name*="summary"]'))
    .first();
  
  await summaryField.fill(summary);
  await expect(summaryField).toHaveValue(summary);
}

// Populates the required Image field via Drupal's "Add or select media" modal by
// selecting the first existing library image (uploading through the modal's AJAX
// dropzone is flaky to automate; selecting an existing item satisfies the field).
async function uploadBlogPostImage(page, imagePath) {
  await page.getByRole('button', { name: /^Add media$/i }).first().click();

  const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: /Add or select media/i }) });
  await expect(dialog).toBeVisible();

  // Wait for the media grid to render, then tick the first item.
  const firstItem = dialog.getByRole('checkbox', { name: /^Select / }).first();
  await firstItem.waitFor({ timeout: 20000 });
  await firstItem.check();
  await expect(dialog.getByText(/1 of \d+ item selected|1 item selected/i)).toBeVisible();

  await dialog.getByRole('button', { name: /Insert selected/i }).click();
  await expect(dialog).toBeHidden();

  // The chosen image now shows in the Image field on the node form.
  await expect(page.getByText(/The maximum number of media items have been selected|item\(s\) selected/i)).toBeVisible();
}

async function fillBlogPostBody(page, bodyContent) {
  // Try to find rich text editor (CKEditor, TinyMCE, etc.)
  const richTextEditors = [
    page.locator('.ck-editor__editable'),  // CKEditor
    page.locator('.tox-editarea'),          // TinyMCE
    page.getByLabel(/body|content/i),       // Generic label
    page.locator('textarea[name*="body"]'), // Textarea
    page.locator('div[contenteditable="true"]'), // Contenteditable div
  ];
  
  for (const editor of richTextEditors) {
    if (await editor.count() > 0) {
      await editor.click();
      await editor.fill(bodyContent);
      await expect(editor).toContainText(bodyContent);
      return;
    }
  }
  
  throw new Error('Could not find blog post body editor');
}

async function saveBlogPost(page) {
  const saveButton = page.getByRole('button', { name: /save.*close|save.*publish|save/i }).first();
  
  if (await saveButton.count() === 0) {
    throw new Error('Save button not found');
  }
  
  await saveButton.click();
  
  // Wait for redirect or success message
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {
    // Navigation might not happen, check for success message instead
  });
}

async function verifyBlogPostCreated(page) {
  // Saving succeeded when Drupal has navigated us off the /node/add form. A
  // validation failure keeps us on it (often with an "Error message" region).
  await expect(page, 'Still on the create form after saving — check for validation errors').not.toHaveURL(/\/node\/add\//);

  // Drupal shows a status message like "News article / Blog post <title> has been created."
  const status = page.locator('[data-drupal-messages], .messages--status, [role="contentinfo"]').filter({ hasText: /has been created|has been saved/i });
  await expect(status.first()).toBeVisible();
}

// Fills the required fields (Title, Summary, Image) and optionally picks a Type, then saves
// with the default "Draft" state — so nothing is ever published on the shared staging site.
// Returns once Drupal has left the /node/add form (it lands on the new post's own page).
async function createBlogPost(page, { title, summary, type }) {
  await page.getByRole('textbox', { name: 'Title *' }).fill(title);
  await page.getByRole('textbox', { name: 'Summary *' }).fill(summary);
  if (type) {
    await page.getByRole('combobox', { name: 'Type *' }).selectOption({ label: type });
  }
  await uploadBlogPostImage(page);
  await page.getByRole('button', { name: 'Save & Close' }).first().click();
  await page.waitForURL((url) => !url.pathname.startsWith('/node/add'));
}

module.exports = {
  createBlogPost,
  fillBlogPostTitle,
  fillBlogPostSummary,
  uploadBlogPostImage,
  fillBlogPostBody,
  saveBlogPost,
  verifyBlogPostCreated,
};
