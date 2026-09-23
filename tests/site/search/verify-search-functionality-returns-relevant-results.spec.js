// case: TC-1602313
// spec: specs/tc-1602313-search-functionality-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { url } = require('../../helpers/siteConfig');

test.describe('Search Functionality', { tag: ['@smoke', '@regression'] }, () => {
  test('Verify search functionality returns relevant results', async ({ page }) => {
    await page.goto(url('/'));
    const searchInput = page.getByRole('textbox', { name: 'Search' });

    // 1. Enter a search term in the search field
    await searchInput.fill('voter registration');
    await expect(searchInput).toHaveValue('voter registration');

    // 2. Submit the search query (Enter — there is no separate search button next to the field)
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/site-search\?search=voter\+registration/);
    await expect(page.getByRole('heading', { name: 'Search results' })).toBeVisible();
    await expect(page.getByText(/Showing \d+ - \d+ of \d+ results found\./)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: /voter|registration/i }).first()).toBeVisible();

    // 3. Enter an empty search query and submit
    await page.goto(url('/'));
    await page.getByRole('textbox', { name: 'Search' }).press('Enter');
    await expect(page).toHaveURL(/\/site-search\?search=$/);
    await expect(page.getByRole('heading', { name: 'Search results' })).toBeVisible();
    await expect(page.getByText('All results')).toBeVisible();
  });
});
