// spec: specs/tc-1601858-footer-social-links-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes case step 12 (screenshot/baseline comparison) — no visual-regression
// baseline exists in this repo, same as tc-1601826.

const { test } = require('@playwright/test');
const { expectConnectWithUsSection } = require('../helpers/footerHelper');

test.describe('Homepage Footer', () => {
  test("Homepage footer - 'Connect with us' social media links", async ({ page }) => {
    // 1-2. Navigate to the homepage, scroll to footer, verify heading + all 5 social icons
    await page.goto('https://test.registertovote.london/');
    await expectConnectWithUsSection(page);
  });
});
