const { test, expect } = require('@playwright/test');
const navHelper = require('../../helpers/navHelper');
const searchHelper = require('../../helpers/searchHelper');
const { BASE_URL } = require('../../helpers/siteConfig');

test('homepage search shows "london" in dropdown when typing "lo" and navigates to search results when selected', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // open menu if the page has a collapsed responsive menu
  await navHelper.openMenuIfPresent(page);

  // Type "lo" in the search input
  await searchHelper.typeInSearch(page, 'lo');

  // Verify "london" appears in the dropdown menu
  await searchHelper.expectSearchResultVisible(page, 'london');

  // Select "london" from the dropdown
  await searchHelper.selectSearchResult(page, 'london');

  // Verify navigation to search results page
  await page.waitForURL(/.*search.*/, { timeout: 5000 });
  await expect(page).toHaveURL(/.*search.*/i);

  // Sort results by relevance
  await searchHelper.sortByRelevance(page);

  // Verify the Relevance option is selected
  const relevanceRadio = page.locator('#edit-sort-bef-combine-relevance-desc');
  await expect(relevanceRadio).toBeChecked();

  // Verify the page is still on search results after sorting
  await expect(page).toHaveURL(/.*search.*/i);
});
