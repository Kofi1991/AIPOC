// spec: specs/tc-1571004-forgot-password-plan.md
// seed: tests/seed.spec.ts

const { test } = require('@playwright/test');
const {
  PASSWORD_RESET_URL,
  expectResetFormVisible,
  submitPasswordReset,
  expectResetConfirmation,
} = require('../helpers/passwordResetHelper');

const FAKE_EMAIL = 'wearetesting@test.com';

test.describe('Password Reset', () => {
  test('Forgot password reset with invalid email address', async ({ page }) => {
    // 1-3. Navigate to the password reset page and verify the form
    await page.goto(PASSWORD_RESET_URL);
    await expectResetFormVisible(page);

    // 4-5. Submit a fake email, solve the anti-bot challenge, confirm the message
    await submitPasswordReset(page, FAKE_EMAIL);
    await expectResetConfirmation(page, FAKE_EMAIL);
  });
});
