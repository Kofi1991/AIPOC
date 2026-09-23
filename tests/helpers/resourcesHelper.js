const { expect } = require('@playwright/test');
const { expectNavLinks } = require('./navHelper');
const { url } = require('./siteConfig');

const RESOURCES_URL = url('/resources');
const BSL_LINK_HREF =
  'https://www.registertovote.london/resources?search=&category_theme=All&language=78&field_resource_type=All&field_resource_format=All';

async function resetResources(page) {
  await page.goto(RESOURCES_URL);
}

async function expectResourcesIntro(page) {
  await expect(page.getByText('Are you looking for resources')).toBeVisible();
  const bulletList = page.locator('ul').filter({ hasText: 'social media toolkits' });
  await expect(bulletList).toMatchAriaSnapshot(`
    - list:
      - listitem: social media toolkits
      - listitem: print materials in English in community languages
      - listitem:
        - text: resources for Deaf and disabled Londoners, including in
        - link "British Sign Language":
          - /url: ${BSL_LINK_HREF}
      - listitem:
        - text: answers to Frequently Asked Questions in English,
        - link "Easy Read":
          - /url: /resources/faq-easy-read
        - text: and community languages
      - listitem: annual evaluation reports into our projects and campaigns
      - listitem: research reports that inform our work
  `);
}

async function expectBslLinkHref(page) {
  await expect(page.getByRole('link', { name: 'British Sign Language' })).toHaveAttribute('href', BSL_LINK_HREF);
}

async function clickEasyReadLink(page) {
  await page.getByRole('link', { name: 'Easy Read', description: 'FAQ - Easy Read' }).click();
}

// The shared header "Search" field is a different control from the page's own
// "Search resources" field below. tests/helpers/searchHelper.js targets `#edit-search`,
// which doesn't match this field — use the placeholder locator instead.
function headerSearchInput(page) {
  return page.getByPlaceholder('Search', { exact: true });
}

async function searchResources(page, term) {
  const input = page.getByPlaceholder('Search resources');
  await input.fill(term);
  await input.press('Enter');
}

async function expectNoResults(page) {
  await expect(page.locator('article article')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toHaveCount(0);
  await expect(page.getByRole('listbox', { name: 'Category' })).toBeVisible();
}

function filterWidget(page, filterName) {
  return page.getByRole('listbox', { name: filterName });
}

// Opens the Choices.js filter widget and clicks its real first selectable option
// (skipping the "- Any -" and placeholder entries). Returns the option's label text.
// Maps a filter's accessible name to its URL query-param key.
const FILTER_PARAM = {
  Category: 'category_theme',
  Language: 'language',
  Type: 'field_resource_type',
  Format: 'field_resource_format',
};

async function selectFirstFilterOption(page, filterName) {
  const widget = filterWidget(page, filterName);
  await expect(widget).toBeVisible();
  await widget.click();
  const options = widget.getByRole('option');
  // The panel's real option list only renders after Choices.js opens it; wait for
  // more than the single always-present placeholder option before reading them.
  await expect(async () => {
    expect(await options.count()).toBeGreaterThan(1);
  }).toPass({ timeout: 10000 });
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const label = (await options.nth(i).textContent())?.trim();
    if (label && label !== '- Any -' && label !== filterName) {
      await options.nth(i).click();
      return label;
    }
  }
  throw new Error(`No selectable option found for filter '${filterName}'`);
}

async function expectFiltersReset(page) {
  for (const name of ['Category', 'Language', 'Type', 'Format']) {
    await expect(filterWidget(page, name)).toContainText(name);
  }
}

// Returns the link locator for the first resource card, after asserting it has
// a non-empty heading, at least one tag/label, and a real (non-'#') href.
function resourceCards(page) {
  return page.locator('article article');
}

async function expectFirstCardValid(page) {
  const firstCard = resourceCards(page).first();
  await expect(firstCard.getByRole('heading', { level: 2 })).not.toBeEmpty();
  const link = firstCard.getByRole('link').first();
  const href = await link.getAttribute('href');
  expect(href).toBeTruthy();
  expect(href).not.toBe('#');
  return link;
}

// Selects the given filter's real first option from a fresh page load and
// returns the resulting URL param value — avoids chaining two live widget
// interactions back-to-back, which races with Choices.js re-initializing
// after the first selection's full-page navigation.
async function captureFilterParamValue(page, filterName) {
  await resetResources(page);
  await selectFirstFilterOption(page, filterName);
  const url = new URL(page.url());
  return url.searchParams.get(FILTER_PARAM[filterName]);
}

async function expectResourcesPageLoaded(page) {
  await expect(page.getByRole('heading', { name: 'Resources', level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Resources');
  await expectNavLinks(page, [
    { text: 'Home', href: '/' },
    { text: 'How to vote', href: '/how-to-vote' },
    { text: 'Our work', href: '/our-work' },
    { text: 'Resources', href: '/resources' },
    { text: 'Blog', href: '/blogs-and-news' },
    { text: 'Contact us', href: '/contact-us' },
  ]);
  await expect(page.getByRole('link', { name: 'Go to language selector' })).toBeVisible();
}

async function expectInlineLinksWork(page) {
  await expectBslLinkHref(page);
  await clickEasyReadLink(page);
  await expect(page).toHaveURL(/\/resources\/faq-easy-read$/);
  await page.goBack();
}

async function expectHeaderSearchWorks(page) {
  const headerSearch = headerSearchInput(page);
  await headerSearch.fill('voter ID');
  await expect(headerSearch).toHaveValue('voter ID');
  await headerSearch.fill('');
  await expect(headerSearch).toHaveValue('');
}

async function expectResourcesSearchWorks(page) {
  await searchResources(page, 'voting');
  await expect(page).toHaveURL(/search=voting/);
  await expect(page.getByRole('heading', { name: /Voting/i }).first()).toBeVisible();
  await resetResources(page);
  await expect(page.getByRole('heading', { name: 'FAQ - English' })).toBeVisible();
  await searchResources(page, 'zzzznoresults123');
  await expectNoResults(page);
}

async function expectAllFiltersWork(page) {
  for (const filterName of ['Category', 'Language', 'Type', 'Format']) {
    await resetResources(page);
    const selected = await selectFirstFilterOption(page, filterName);
    await expect(filterWidget(page, filterName)).toContainText(selected);
  }
}

async function expectCombinedFilterWorks(page) {
  const categoryValue = await captureFilterParamValue(page, 'Category');
  const formatValue = await captureFilterParamValue(page, 'Format');
  await page.goto(
    `${RESOURCES_URL}?search=&category_theme=${categoryValue}&language=All&field_resource_type=All&field_resource_format=${formatValue}`
  );
  await expect(page).toHaveURL(new RegExp(`category_theme=${categoryValue}`));
  await expect(page).toHaveURL(new RegExp(`field_resource_format=${formatValue}`));
}

async function expectFiltersResetToDefault(page) {
  await resetResources(page);
  await expectFiltersReset(page);
  await expect(page.getByRole('heading', { name: 'FAQ - English' })).toBeVisible();
}

async function expectFirstCardNavigatesAndBack(page) {
  const firstCardLink = await expectFirstCardValid(page);
  await firstCardLink.click();
  await expect(page).not.toHaveURL(new RegExp(`${RESOURCES_URL}$`));
  await page.goBack();
  await expect(page).toHaveURL(RESOURCES_URL);
}

module.exports = {
  RESOURCES_URL,
  FILTER_PARAM,
  captureFilterParamValue,
  resetResources,
  expectResourcesIntro,
  expectBslLinkHref,
  clickEasyReadLink,
  headerSearchInput,
  searchResources,
  expectNoResults,
  filterWidget,
  selectFirstFilterOption,
  expectFiltersReset,
  resourceCards,
  expectFirstCardValid,
  expectResourcesPageLoaded,
  expectInlineLinksWork,
  expectHeaderSearchWorks,
  expectResourcesSearchWorks,
  expectAllFiltersWork,
  expectCombinedFilterWorks,
  expectFiltersResetToDefault,
  expectFirstCardNavigatesAndBack,
};
