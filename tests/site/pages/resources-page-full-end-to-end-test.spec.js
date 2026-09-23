// case: TC-1601826
// spec: specs/tc-1601826-resources-e2e-plan.md
// seed: tests/seed.spec.ts

const { test } = require('@playwright/test');
const {
  RESOURCES_URL,
  expectResourcesPageLoaded,
  expectResourcesIntro,
  expectInlineLinksWork,
  expectHeaderSearchWorks,
  expectResourcesSearchWorks,
  expectAllFiltersWork,
  expectCombinedFilterWorks,
  expectFiltersResetToDefault,
  expectFirstCardNavigatesAndBack,
} = require('../../helpers/resourcesHelper');

test.describe('Resources Page', { tag: ['@regression'] }, () => {
  test('Resources page full end-to-end test', async ({ page }) => {
    // 1. Navigate to the Resources page
    await page.goto(RESOURCES_URL);
    await expectResourcesPageLoaded(page);

    // 2. Read the intro paragraph and the 6-item bullet list beneath it
    await expectResourcesIntro(page);

    // 3. British Sign Language and Easy Read inline links
    await expectInlineLinksWork(page);

    // 4. Top-level header Search field
    await expectHeaderSearchWorks(page);

    // 5. Page-level 'Search resources' field
    await expectResourcesSearchWorks(page);

    // 6. Category/Language/Type/Format filter widgets
    await expectAllFiltersWork(page);

    // 7. Combined Category + Format filter
    await expectCombinedFilterWorks(page);

    // 8. Reset filters
    await expectFiltersResetToDefault(page);

    // 9. First card: click through and back
    await expectFirstCardNavigatesAndBack(page);
  });
});
