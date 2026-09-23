// spec: specs/tc-1601860-footer-branding-links-plan.md
// seed: tests/seed.spec.ts

const { test } = require('@playwright/test');
const { openMenuIfPresent } = require('../../helpers/navHelper');
const { expectFooterComplete, clickEmailLink } = require('../../helpers/footerHelper');
const { url } = require('../../helpers/siteConfig');

test.describe('Homepage Footer', { tag: ['@smoke', '@regression'] }, () => {
  test('Homepage footer - GLA branding, address, and link columns', async ({ page }) => {
    await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
    await openMenuIfPresent(page);

    await expectFooterComplete(page);
    await clickEmailLink(page);
  });
});
