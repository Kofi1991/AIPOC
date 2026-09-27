// case: TC-1578411
// spec: specs/tc-1578411-1578415-plan.md
// seed: tests/seed.spec.ts
// NOTE: the case's title says "manage content workflow" but its steps are entirely about footer
// navigation and the translate widget — automated as written, not as titled. See plan Drift.
// NOTE: step 9 (accessibility) is not automated — see plan Drift.

const { test, expect } = require('@playwright/test');
const { url } = require('../../helpers/siteConfig');
const { getFooter } = require('../../helpers/footerHelper');
const { pickRandomLanguage, translateAndVerify, expectTranslateWidgetVisible } = require('../../helpers/translateHelper');

test.describe('Footer Navigation and Translate Persistence', { tag: ['@regression'] }, () => {
  test('Verify user is able to manage content workflow', async ({ page }) => {
    test.setTimeout(90_000);

    // Step 3: the footer logo links back to the homepage.
    await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
    const footer = await getFooter(page);
    await footer.getByAltText('GLA Democracy Hub').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(url('/'));

    // Step 4: spot-check three footer links actually navigate to their real destinations.
    const spotChecks = [
      { name: 'Blog', path: '/blogs-and-news' },
      { name: 'How to vote', path: '/how-to-vote' },
      { name: 'Resources', path: '/resources' },
    ];
    for (const { name, path } of spotChecks) {
      await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
      const f = await getFooter(page);
      await f.getByRole('link', { name, exact: true }).click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(url(path));
    }

    // Step 5: the Facebook social icon opens the real external page in a new tab.
    await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
    const f2 = await getFooter(page);
    const [popup] = await Promise.all([
      page.context().waitForEvent('page'),
      f2.getByRole('link', { name: /Facebook/i }).click(),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    expect(popup.url()).toContain('facebook.com/LDNgov');
    await popup.close();

    // Steps 6-8: translate, confirm it's still applied on a second page (it reapplies a moment
    // after a fresh page load, not instantly), then revert to English.
    await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
    await expectTranslateWidgetVisible(page);
    const language = await pickRandomLanguage(page);
    await translateAndVerify(page, language);

    const englishTitle = 'How to vote | Democracy Hub';
    await page.goto(url('/how-to-vote'), { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveTitle(englishTitle, { timeout: 10000 });

    await translateAndVerify(page, 'English');
    await expect(page).toHaveTitle(englishTitle);
  });
});
