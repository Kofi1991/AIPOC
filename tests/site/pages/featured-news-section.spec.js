// case: TC-1601867
// spec: specs/tc-1601867-featured-news-plan.md
// seed: tests/seed.spec.ts
// NOTE: excludes case step 14 (screenshot/baseline comparison) — no visual-regression
// baseline exists in this repo, same as tc-1601826/tc-1601858/tc-1601860.

const { test } = require('@playwright/test');
const {
  HOME_URL,
  expectFeaturedNewsLoaded,
  expectAllCardsValid,
  expectCardNavigatesAndBack,
} = require('../../helpers/featuredNewsHelper');

test.describe('Homepage Featured News', { tag: ['@smoke', '@regression'] }, () => {
  test("Homepage - 'Featured news' section", async ({ page }) => {
    // 1-3. Navigate to the homepage, scroll to Featured news, confirm heading + card count (1-2)
    await page.goto(HOME_URL);
    await expectFeaturedNewsLoaded(page);

    // 4, 7. Inspect both cards: image, heading, summary
    await expectAllCardsValid(page);

    // 5-6. Click the first card and confirm it navigates to a real article, then back
    await expectCardNavigatesAndBack(page, 0);
  });
});
