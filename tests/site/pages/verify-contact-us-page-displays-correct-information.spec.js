// case: TC-1578296
// spec: specs/tc-1578296-contact-us-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { url } = require('../../helpers/siteConfig');
const {
  expectContactPageInfo,
  submitNewsletterSignup,
  expectInvalidEmailError,
} = require('../../helpers/contactPageHelper');

test.describe('Contact Us Page', { tag: ['@smoke', '@regression'] }, () => {
  test('Verify Contact us page displays correct information', async ({ page }) => {
    // 1. Navigate to the Contact us page
    await page.goto(url('/contact-us'), { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/contact-us$/);

    // 2-3. Verify the email link and physical address are displayed
    await expectContactPageInfo(page);

    // 4. Enter an invalid email format in the newsletter subscription form
    await submitNewsletterSignup(page, { firstName: 'Test', lastName: 'User', email: 'invalidemail' });
    await expectInvalidEmailError(page, 'invalidemail');
  });
});
