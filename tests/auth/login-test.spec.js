const { test, expect } = require('@playwright/test');
const { url } = require('../helpers/siteConfig');

// Tests always run against staging (test.registertovote.london), never production.
test('TC-1455: Login Test Only', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
  const username = process.env.TC_ADMIN_USER;
  const password = process.env.TC_ADMIN_PASS;

  // Navigate to login page
  await page.goto(url('/user/login'), { waitUntil: 'domcontentloaded' });
  console.log('✓ Navigated to login page');
  
  // Enter username
  const usernameField = page.getByLabel('Username');
  await usernameField.fill(username);
  console.log('✓ Username entered');
  
  // Enter password
  const passwordField = page.getByLabel('Password');
  await passwordField.fill(password);
  console.log('✓ Password entered');
  
  // Log page content before clicking login
  const htmlBefore = await page.content();
  console.log('Page HTML length before login:', htmlBefore.length);
  
  // Click login button
  const loginButton = page.getByRole('button', { name: /log in/i });
  await loginButton.click();
  console.log('✓ Login button clicked');
  
  // Wait and check what happens
  await page.waitForTimeout(3000);
  
  // Log current URL and page content
  const currentUrl = page.url();
  const htmlAfter = await page.content();
  console.log('Current URL after login:', currentUrl);
  console.log('Page HTML length after login:', htmlAfter.length);
  
  // Check if there's a math challenge
  if (htmlAfter.includes('math') || htmlAfter.includes('verify') || htmlAfter.includes('answer')) {
    console.log('⚠ Math challenge detected on page');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'login-test.png' });
  console.log('✓ Screenshot saved as login-test.png');
});
