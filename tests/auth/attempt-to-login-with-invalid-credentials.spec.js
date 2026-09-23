// spec: specs/tc-1578199-login-invalid-credentials-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { attemptInvalidLogin } = require('../helpers/authHelper');

test.describe('Login', { tag: ['@smoke', '@regression'] }, () => {
  test('Attempt to login with invalid credentials', async ({ page }) => {
    // 1-7. Submit a fake account; retries through the anti-bot math challenge internally
    await attemptInvalidLogin(page, process.env.TC_INVALID_USER, process.env.TC_INVALID_PASS);

    await expect(page).toHaveURL(/\/user\/login/);
    await expect(page.getByText('Unrecognized username or password.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot your password?' })).toHaveAttribute('href', '/user/password');
  });
});
