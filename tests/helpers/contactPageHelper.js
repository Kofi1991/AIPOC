const { expect } = require('@playwright/test');

async function expectContactPageInfo(page) {
  await expect(page.getByRole('heading', { name: 'Contact us', level: 1 })).toBeVisible();

  const emailLink = page.getByRole('link', { name: '(link sends email)' });
  await expect(emailLink).toBeVisible();
  await expect(emailLink).toHaveAttribute('href', 'mailto:democracy@london.gov.uk');

  const article = page.locator('article');
  await expect(article).toContainText('Kamal Chunchie Way');
  await expect(article).toContainText('London');
  await expect(article).toContainText('E16 1ZE');
}

async function submitNewsletterSignup(page, { firstName, lastName, email }) {
  await page.getByRole('textbox', { name: 'First name' }).fill(firstName);
  await page.getByRole('textbox', { name: 'Last name' }).fill(lastName);
  await page.getByRole('textbox', { name: 'Your email' }).fill(email);
  await page.getByRole('button', { name: 'Sign up' }).click();
}

async function expectInvalidEmailError(page, email) {
  await expect(page.getByText(`The email address ${email} is not valid. Use the format user@example.com.`)).toBeVisible();
  await expect(page.getByText('First name field is required.')).not.toBeVisible();
  await expect(page.getByText('Last name field is required.')).not.toBeVisible();
}

module.exports = {
  expectContactPageInfo,
  submitNewsletterSignup,
  expectInvalidEmailError,
};
