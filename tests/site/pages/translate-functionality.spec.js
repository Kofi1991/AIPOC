// case: TC-1571006
// spec: specs/tc-1571006-translate-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { url } = require('../../helpers/siteConfig');
const {
  expectTranslateWidgetVisible,
  pickRandomLanguage,
  translateAndVerify,
} = require('../../helpers/translateHelper');

test.describe('Translate Functionality', { tag: ['@smoke', '@regression'] }, () => {
  test('Translate functionality', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto(url('/user/login'), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
    await expectTranslateWidgetVisible(page);

    // 2. Select any language at random
    const language = await pickRandomLanguage(page);

    // 3. Translate — page should translate to the language which was selected
    await translateAndVerify(page, language);
  });
});
