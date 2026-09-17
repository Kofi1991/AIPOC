// spec: specs/tc-1571002-login-empty-credentials-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');

const LOGIN_URL = 'https://test.registertovote.london/user/login';
const HINT_TEXT = 'Please enter your username and password.';

test.describe('Login', () => {
  test('Login attempt with empty credentials', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto(LOGIN_URL);
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByText(HINT_TEXT)).toBeVisible();

    // 2. Leave Username and Password empty and click the Log in button
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(page.getByText(HINT_TEXT)).toBeVisible();
  });
});
