const { expect } = require('@playwright/test');

async function getSearchInput(page) {
  // Use the specific search input ID from the site-search page
  const searchInput = page.locator('#edit-search');
  
  if ((await searchInput.count()) === 0) {
    throw new Error('Search input not found on page');
  }
  
  return searchInput;
}

async function getSearchDropdown(page) {
  // Use the specific jQuery UI autocomplete dropdown ID
  const dropdown = page.locator('#ui-id-1');
  
  if ((await dropdown.count()) === 0) {
    throw new Error('Search dropdown not found on page');
  }
  
  return dropdown;
}

async function typeInSearch(page, searchTerm) {
  const searchInput = await getSearchInput(page);
  await searchInput.focus();
  await searchInput.type(searchTerm);
}

async function expectSearchResultVisible(page, resultText) {
  const dropdown = await getSearchDropdown(page);
  await expect(dropdown).toBeVisible();
  
  const result = dropdown.getByText(resultText, { exact: false }).first();
  await expect(result).toBeVisible();
}

async function expectSearchResultsContain(page, expectedTexts) {
  const dropdown = await getSearchDropdown(page);
  await expect(dropdown).toBeVisible();

  for (const text of expectedTexts) {
    const result = dropdown.getByText(text, { exact: false });
    await expect(result).toBeVisible();
  }
}

async function clearSearch(page) {
  const searchInput = await getSearchInput(page);
  await searchInput.clear();
}

async function selectSearchResult(page, resultText) {
  const dropdown = await getSearchDropdown(page);
  await expect(dropdown).toBeVisible();
  
  const result = dropdown.getByText(resultText, { exact: false }).first();
  await result.click();
}

async function sortByRelevance(page) {
  // Click the "Relevance" radio button in the sort section
  const relevanceRadio = page.locator('#edit-sort-bef-combine-relevance-desc');
  
  if ((await relevanceRadio.count()) === 0) {
    throw new Error('Relevance sort option not found on search results page');
  }
  
  // Check if already selected
  const isChecked = await relevanceRadio.isChecked();
  if (!isChecked) {
    // Scroll into view and click
    await relevanceRadio.scrollIntoViewIfNeeded();
    await relevanceRadio.click();
  }
}

module.exports = {
  getSearchInput,
  getSearchDropdown,
  typeInSearch,
  expectSearchResultVisible,
  expectSearchResultsContain,
  clearSearch,
  selectSearchResult,
  sortByRelevance,
};
