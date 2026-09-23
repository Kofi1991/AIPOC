// spec: specs/tc-1578395-1578398-landing-page-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes step 7 (Site Admin repeat) — no TC_SITEADMIN_USER/TC_SITEADMIN_PASS configured.
// NOTE: step 4 ("redirected to FE") and the hover/focus-box/selected-state part of step 6
// are not automated — see the plan's Drift. The CTA has no focus outline live; the case's
// own author already noted and waived this.
// Two paragraph components are selected from the "Add Paragraph" picker here: "Documents"
// (a media attachment) and "Text". Documents is deliberately one the other content-type specs
// don't use, which is what the case asks for ("maybe try one that is different to previous
// checks"); Text carries the step's "Body text" alongside the node's own Body field.

const { test, expect } = require('@playwright/test');
const { login, logout, dismissAutosaveDialog } = require('../../helpers/authHelper');
const { editContentItemFromList, setRichTextBody } = require('../../helpers/contentPageHelper');
const {
  openContentForm, createLandingPage, pickMediaForField, addDocumentsParagraph, addTextParagraph,
  fillCta, fillNodeTitle, saveAndClose, openNodePageFromList, slugify, deleteQuietly,
} = require('../../helpers/contentTypeHelper');

test.describe('Landing Page Editing (BBD)', { tag: ['@smoke', '@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify users can edit Landing Pages', async ({ page }) => {
    test.setTimeout(120_000);

    // GIVEN the User is logged in as an Admin
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);

    // Precondition: a Landing Page created with Title and Summary
    const title = `Landing edit role ${Date.now()}`;
    const newTitle = `${title} EDITED`;
    const bodyText = `Body text ${Date.now()}`;
    const paragraphText = `Paragraph text ${Date.now()}`;
    await openContentForm(page, 'landing');
    await createLandingPage(page, { title, summary: 'Original summary' });

    let current = title;
    try {
      // Step 1: select to Edit the newly created Landing Page
      await editContentItemFromList(page, title);
      await dismissAutosaveDialog(page);

      // Step 2: add paragraphs via the "Add Paragraph" picker — a "Documents" component,
      // then a "Text" one — plus Body text, a Hero image and a CTA.
      await addDocumentsParagraph(page);
      await addTextParagraph(page, `<p>${paragraphText}</p>`);
      await setRichTextBody(page, `<p>${bodyText}</p>`);
      await pickMediaForField(page, 'Hero image');
      await fillCta(page, { url: 'https://www.gov.uk/register-to-vote', linkText: 'Edited CTA' });

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
      await expect(page.getByText(paragraphText)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Edited CTA' })).toBeVisible();
      await expect(page.getByRole('main').getByRole('img').first()).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(`/${slugify(newTitle)}`);

      // Step 6 (partial): the CTA can be reached by keyboard
      const ctaLink = page.getByRole('link', { name: 'Edited CTA' });
      await ctaLink.focus();
      await expect(ctaLink).toBeFocused();
    } finally {
      await deleteQuietly(page, current);
    }
  });
});
