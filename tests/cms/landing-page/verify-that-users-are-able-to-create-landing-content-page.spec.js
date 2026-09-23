// spec: specs/tc-1578356-1578402-content-types-plan.md
// seed: tests/seed.spec.ts
// NOTE: case step 2 (Summary NOT shown) and the image caption in step 3 are not automated — see plan Drift.
const { test, expect } = require('@playwright/test');
const { login, logout, navigateToBlogCreation, dismissAutosaveDialog } = require('../../helpers/authHelper');
const {
  openContentForm, createHomepage, createLandingPage, createResource, saveAndClose, saveAndWaitForNodePage,
  pickMediaForField, expectBlankSubmitBlockedByBrowser, openNodePageFromList, slugify, deleteQuietly,
  typeTitleFormattedAsHeading, addTextParagraph,
} = require('../../helpers/contentTypeHelper');
const {
  expectContentItemInList, expectContentItemAbsentFromList, deleteContentItemFromList, editContentItemFromList,
  filterContentListByTitle, setRichTextBody, addLatestNewsAndBlogsParagraph, expectLatestNewsAndBlogsParagraphVisible,
  openGenericPageForm, createGenericPage,
} = require('../../helpers/contentPageHelper');

test.describe('Landing Page Creation', { tag: ['@smoke', '@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify That Users Are Able To Create  Landing Content Page', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // WHEN the User creates a new Landing Page AND fills Title, Summary, Hero image and CTA
    await openContentForm(page, 'landing');
    const title = `Landing to create ${Date.now()}`;
    const ctaText = `CTA ${Date.now()}`;
    const ctaUrl = 'https://www.gov.uk/register-to-vote';
    try {
      await page.getByRole('textbox', { name: 'Title *' }).fill(title);
      await page.getByRole('textbox', { name: 'Summary *' }).fill('Automated summary for create test');
      await pickMediaForField(page, 'Hero image');
      const cta = page.getByRole('group', { name: 'CTA' });
      await cta.getByRole('textbox', { name: 'URL' }).fill(ctaUrl);
      await cta.getByRole('textbox', { name: 'Link text' }).fill(ctaText);
      await saveAndWaitForNodePage(page);

      // THEN the Page will be created, with the Title as the H1
      await expect(page).not.toHaveURL(/\/node\/add\//);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      // AND the Hero image and the CTA link are shown
      await expect(page.getByRole('main').getByRole('img').first()).toBeVisible();
      await expect(page.getByRole('link', { name: ctaText })).toHaveAttribute('href', ctaUrl);
    } finally {
      await deleteQuietly(page, title);
    }
  });
});
