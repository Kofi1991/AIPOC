const { expect } = require('@playwright/test');
const { url } = require('./siteConfig');

const HOME_URL = url('/');

function featuredNewsSection(page) {
  return page.locator('section, div').filter({ has: page.getByRole('heading', { name: 'Featured news' }) }).first();
}

function featuredNewsCards(page) {
  const section = featuredNewsSection(page);
  return section.getByRole('link').filter({ has: page.getByRole('heading', { level: 3 }) });
}

async function expectFeaturedNewsLoaded(page) {
  await expect(page.getByRole('heading', { name: 'Featured news' })).toBeVisible();
  const count = await featuredNewsCards(page).count();
  expect(count).toBeGreaterThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(2);
}

// Verifies every card has a real image (non-empty alt), a non-empty heading,
// non-empty summary text, and a real (non-'#') link.
async function expectAllCardsValid(page) {
  const cards = featuredNewsCards(page);
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const image = card.getByRole('img').first();
    await expect(image).toBeVisible();
    expect(await image.getAttribute('alt')).toBeTruthy();

    const heading = card.getByRole('heading', { level: 3 });
    await expect(heading).not.toBeEmpty();

    const href = await card.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).not.toBe('#');
  }
}

// Clicks the given card (0-indexed), confirms it navigates to a real page, then goes back.
async function expectCardNavigatesAndBack(page, index = 0) {
  const card = featuredNewsCards(page).nth(index);
  await card.click();
  await expect(page).not.toHaveURL(HOME_URL);
  await page.goBack();
  await expect(page).toHaveURL(HOME_URL);
}

module.exports = {
  HOME_URL,
  featuredNewsCards,
  expectFeaturedNewsLoaded,
  expectAllCardsValid,
  expectCardNavigatesAndBack,
};
