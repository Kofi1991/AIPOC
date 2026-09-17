const { expect } = require('@playwright/test');

const PASSWORD_RESET_URL = 'https://test.registertovote.london/user/password';
const HOME_URL = 'https://test.registertovote.london/';

async function expectResetFormVisible(page) {
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Username or email address' })).toBeVisible();
  await expect(page.getByText('Password reset instructions will be sent to your registered email address.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
}

// Submits an email through the password-reset form, answering the anti-bot math
// challenge if it appears (same retry pattern as authHelper's login helpers).
async function submitPasswordReset(page, email) {
  await page.getByRole('textbox', { name: 'Username or email address' }).fill(email);
  await page.getByRole('button', { name: 'Submit' }).click();

  const mathQuestion = page.getByText(/Math question \((\d+)\s*([+\-*/])\s*(\d+)\s*=\)/);
  for (let attempt = 0; attempt < 5 && (await mathQuestion.isVisible().catch(() => false)); attempt++) {
    const [, a, operator, b] = (await mathQuestion.textContent()).match(/\((\d+)\s*([+\-*/])\s*(\d+)\s*=\)/);
    const answer = { '+': (x, y) => x + y, '-': (x, y) => x - y, '*': (x, y) => x * y, '/': (x, y) => x / y }[operator](
      Number(a),
      Number(b)
    );

    await page.getByRole('textbox', { name: /Math question/ }).fill(String(answer));
    await page.getByRole('button', { name: 'Submit' }).click();
  }
}

async function expectResetConfirmation(page, email) {
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole('heading', { name: 'Status message' })).toBeVisible();
  await expect(
    page.getByText(`If ${email} is a valid account, an email will be sent with instructions to reset your password.`)
  ).toBeVisible();
}

module.exports = {
  PASSWORD_RESET_URL,
  expectResetFormVisible,
  submitPasswordReset,
  expectResetConfirmation,
};
