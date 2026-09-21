// spec: specs/tc-1602308-1602312-how-to-vote-pages-plan.md
// seed: tests/seed.spec.ts
// NOTE: the case says "redirected", but all three links open in a new tab. The Electoral
// Commission site blocks headless browsers, so only each tab's destination URL is checked.

const { test } = require('@playwright/test');
const { REGISTER_URL, EXTERNAL_LINKS, expectExternalLinkOpensNewTab } = require('../helpers/registerToVoteHelper');

test.describe('Register to vote external links', () => {
  test('Verify external links for voter registration open correctly', async ({ page }) => {
    await page.goto(REGISTER_URL);

    // 1. 'Register to vote now'   2. 'Check if you can register and vote'   3. 'Find out more about voting rights'
    for (const link of EXTERNAL_LINKS) {
      await expectExternalLinkOpensNewTab(page, link);
    }
  });
});
