// case: TC-1578414
// spec: specs/tc-1578414-paragraphs-components-plan.md
// seed: tests/seed.spec.ts
// NOTE: "Resource Listing" is skipped per the case's own step 2 ("does not show on FE") and is
// not one of the 14 real paragraph types on Landing Page — see plan Drift.
// NOTE: split into 7 tests of 2 paragraph types each, each on its own throwaway Landing Page
// node, rather than all 14 on one node as the case's step 2 implies — see plan Drift.
// NOTE: step 4 (accessibility) is not automated — the case's own author already spot-checked
// and waived it, see plan Drift.

const { test, expect } = require('@playwright/test');
const { login, logout } = require('../../helpers/authHelper');
const t = require('../../helpers/contentTypeHelper');
const cp = require('../../helpers/contentPageHelper');

async function openNewLanding(page, label) {
  const ts = Date.now();
  const title = `Paragraphs ${label} ${ts}`;
  await t.openContentForm(page, 'landing');
  await t.fillNodeTitle(page, title);
  await page.getByRole('textbox', { name: 'Summary *' }).fill(`Summary ${ts}`);
  return { ts, title };
}

// Attaches full-page evidence of the just-created node's FE to the HTML report, as a series of
// screenshots taken at the real (unmodified) viewport size while scrolling down the page.
// Neither `page.screenshot({ fullPage: true })` nor resizing the viewport to the page's measured
// height works here: this theme has at least one paragraph (the CTA) built with `vh`-relative
// sizing, which recomputes against whatever "viewport" height is in effect at capture time —
// Chromium's fullPage capture virtually (and incorrectly) expands it via CDP, and resizing the
// real viewport just makes the `vh` block itself grow to match, so neither ever converges on the
// real, as-rendered page. Scrolling within the real, standard viewport is what an actual user
// sees, so it's both correct and avoids the `vh` recomputation entirely.
async function attachFullPageScreenshot(page, testInfo, label) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewport = page.viewportSize() || { width: 1280, height: 720 };
  let part = 1;
  for (let y = 0; y < height; y += viewport.height) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(150);
    const body = await page.screenshot();
    await testInfo.attach(`${label} — part ${part}`, { body, contentType: 'image/png' });
    part += 1;
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

test.describe('Paragraphs Components Functionality (BBD)', { tag: ['@regression'] }, () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('Verify Accordion and Text paragraphs', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);
    const { ts, title } = await openNewLanding(page, 'pair1');

    try {
      await t.addAccordionParagraph(page, {
        heading: `AccHead ${ts}`, itemTitle: `AccItem ${ts}`, itemBody: `AccBody ${ts}`,
      });
      await t.addTextParagraph(
        page,
        `<p>TextPara ${ts} <strong>bold</strong> <em>italic</em></p><ul><li>bullet ${ts}</li></ul>`,
      );
      await t.saveAndWaitForNodePage(page);

      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();

      // Accordion item is collapsed by default and opens on click.
      const toggle = page.getByRole('button', { name: `AccItem ${ts}` });
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(page.getByText(`AccBody ${ts}`)).toBeVisible();

      // Text paragraph renders with its stylings (bold/italic/list).
      await expect(page.getByText(`TextPara ${ts}`)).toBeVisible();
      await expect(page.getByRole('listitem').filter({ hasText: `bullet ${ts}` })).toBeVisible();

      await attachFullPageScreenshot(page, testInfo, 'Accordion + Text');
    } finally {
      await t.deleteQuietly(page, title);
    }
  });

  test('Verify Image / video and Call to action paragraphs', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);
    const { ts, title } = await openNewLanding(page, 'pair2');

    try {
      await t.addImageVideoParagraph(page, { title: `ImgVid ${ts}` });
      // CTA fields aren't marked required in the CMS, but the case asks that they be filled in.
      await t.addCallToActionParagraph(page, {
        title: `CtaTitle ${ts}`, ctaUrl: 'https://www.gov.uk/register-to-vote', ctaLinkText: `CtaLink ${ts}`,
      });
      await t.saveAndWaitForNodePage(page);

      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.getByRole('heading', { name: `ImgVid ${ts}` })).toBeVisible();
      await expect(page.getByRole('heading', { name: `CtaTitle ${ts}` })).toBeVisible();
      await expect(page.getByRole('link', { name: `CtaLink ${ts}` })).toBeVisible();

      await attachFullPageScreenshot(page, testInfo, 'Image/video + Call to action');
    } finally {
      await t.deleteQuietly(page, title);
    }
  });

  test('Verify Partners / logo listing and Embed paragraphs', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);
    const { ts, title } = await openNewLanding(page, 'pair3');

    try {
      await t.addPartnersLogoParagraph(page, { title: `Partners ${ts}` });
      // The case's own supplied YouTube test-video snippet, adapted to a real embeddable URL.
      const embedHtml = '<iframe width="560" height="315" src="https://www.youtube.com/embed/C0DPdy98e4c" '
        + 'title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; '
        + 'encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
      await t.addEmbedParagraph(page, embedHtml);
      await t.saveAndWaitForNodePage(page);

      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.getByRole('heading', { name: `Partners ${ts}` })).toBeVisible();
      await expect(page.locator('iframe[src*="youtube"]')).toBeVisible();

      await attachFullPageScreenshot(page, testInfo, 'Partners/logo + Embed');
    } finally {
      await t.deleteQuietly(page, title);
    }
  });

  test('Verify Dual column block and Documents paragraphs', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);
    const { ts, title } = await openNewLanding(page, 'pair4');

    try {
      await t.addDualColumnParagraph(page, { title: `DualCol ${ts}` });
      await t.addDocumentsParagraph(page);
      await t.saveAndWaitForNodePage(page);

      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.getByRole('heading', { name: `DualCol ${ts}` })).toBeVisible();
      await expect(page.locator('.paragraph--type--documents').first()).toBeVisible();

      await attachFullPageScreenshot(page, testInfo, 'Dual column block + Documents');
    } finally {
      await t.deleteQuietly(page, title);
    }
  });

  test('Verify Multi-card block and Chatbot CTA paragraphs', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);
    const { ts, title } = await openNewLanding(page, 'pair5');

    try {
      // Multi-card block enforces a minimum of 2 Card sub-paragraphs — see plan Drift.
      await t.addMultiCardParagraph(page, [
        { cardTitle: `Card1 ${ts}`, cardUrl: 'https://www.gov.uk/register-to-vote' },
        { cardTitle: `Card2 ${ts}`, cardUrl: 'https://www.gov.uk/register-to-vote' },
      ]);
      await t.addChatbotCtaParagraph(page, {
        title: `Chatbot ${ts}`,
        subTitle: `ChatSub ${ts}`,
        summary: `ChatSum ${ts}`,
        linkUrl: 'https://www.gov.uk/register-to-vote',
        linkText: `ChatLink ${ts}`,
        ctaText: `ChatCTA ${ts}`,
      });
      await t.saveAndWaitForNodePage(page);

      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.getByRole('link', { name: `Card1 ${ts}` })).toBeVisible();
      await expect(page.getByRole('link', { name: `Card2 ${ts}` })).toBeVisible();
      await expect(page.getByRole('heading', { name: `Chatbot ${ts}` })).toBeVisible();

      await attachFullPageScreenshot(page, testInfo, 'Multi-card block + Chatbot CTA');
    } finally {
      await t.deleteQuietly(page, title);
    }
  });

  test('Verify Latest news and blogs and Newsletter signup paragraphs', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);
    const { ts, title } = await openNewLanding(page, 'pair6');

    try {
      await cp.addLatestNewsAndBlogsParagraph(page);
      await t.addNewsletterSignupParagraph(page, { title: `Newsletter ${ts}` });
      await t.saveAndWaitForNodePage(page);

      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await cp.expectLatestNewsAndBlogsParagraphVisible(page);
      await expect(page.getByRole('heading', { name: `Newsletter ${ts}` })).toBeVisible();

      await attachFullPageScreenshot(page, testInfo, 'Latest news and blogs + Newsletter signup');
    } finally {
      await t.deleteQuietly(page, title);
    }
  });

  test('Verify Resources menu and Webform paragraphs', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);
    const { ts, title } = await openNewLanding(page, 'pair7');

    try {
      await t.addResourcesMenuParagraph(page, {
        cardTitle: `ResMenu ${ts}`, cardLink: 'https://www.gov.uk/register-to-vote',
      });
      await t.addWebformParagraph(page);
      await t.saveAndWaitForNodePage(page);

      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      // Longer timeout: this card has intermittently taken longer than the 5s default to
      // hydrate on staging, unlike the other paragraph types' assertions in this file.
      await expect(page.getByRole('link', { name: `ResMenu ${ts}` })).toBeVisible({ timeout: 20000 });
      await expect(page.locator('form.webform-submission-form')).toBeVisible();

      await attachFullPageScreenshot(page, testInfo, 'Resources menu + Webform');
    } finally {
      await t.deleteQuietly(page, title);
    }
  });
});
