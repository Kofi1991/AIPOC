const { expect } = require('@playwright/test');

// The "Back to top" button isn't in the DOM until the page has been scrolled ~100px, and
// it hides again once the page is back at the top.
function backToTopButton(page) {
  return page.getByRole('navigation', { name: 'Back to top' }).getByRole('button', { name: 'Back to top' });
}

async function scrollToPageBottom(page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

// The scroll animates for ~1-2s, so poll for the end state rather than reading scrollY once
// (a single read mid-animation gives an arbitrary offset). Smoothness itself isn't asserted.
async function expectPageScrolledToTop(page) {
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 10000 }).toBe(0);
}

module.exports = { backToTopButton, scrollToPageBottom, expectPageScrolledToTop };
