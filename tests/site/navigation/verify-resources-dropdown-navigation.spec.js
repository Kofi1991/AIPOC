// spec: specs/tc-1578303-resources-navigation-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { getMainNav } = require('../../helpers/navHelper');
const { filterWidget } = require('../../helpers/resourcesHelper');
const { url } = require('../../helpers/siteConfig');

test.describe('Resources Navigation', { tag: ['@smoke', '@regression'] }, () => {
  test('Verify Resources dropdown navigation', async ({ page }) => {
    // 1. Navigate to the homepage and click 'Resources' in the main navigation
    await page.goto(url('/'));
    const mainNav = await getMainNav(page);
    await mainNav.getByRole('link', { name: 'Resources' }).click();
    await expect(page).toHaveURL(/\/resources$/);
    await expect(page.getByRole('heading', { name: 'Resources', level: 1 })).toBeVisible();

    // 2. Open the 'Category' filter and verify the real subcategory options
    const categoryFilter = filterWidget(page, 'Category');
    await categoryFilter.click();
    await expect(categoryFilter.getByRole('option', { name: 'Civic and democratic participation' })).toBeVisible();
    await expect(categoryFilter.getByRole('option', { name: 'London Voter Registration Week 2025' })).toBeVisible();
    await expect(categoryFilter.getByRole('option', { name: 'Media and political literacy' })).toBeVisible();
    const voterIdOption = categoryFilter.getByRole('option', { name: 'Voter ID', exact: true });
    await expect(voterIdOption).toHaveCount(1);
    await expect(voterIdOption).toBeVisible();

    const voterRegistrationOption = categoryFilter.getByRole('option', { name: 'Voter Registration', exact: true });
    await expect(voterRegistrationOption).toHaveCount(1);
    await expect(voterRegistrationOption).toBeVisible();
  });
});
