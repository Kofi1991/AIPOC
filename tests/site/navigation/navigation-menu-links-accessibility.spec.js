// spec: specs/tc-1571005-navigation-menu-links-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const { getMainNav } = require('../../helpers/navHelper');
const { url } = require('../../helpers/siteConfig');

const NAV_LINKS = [
  { text: 'How to vote', href: '/how-to-vote' },
  { text: 'Our work', href: '/our-work' },
  { text: 'Resources', href: '/resources' },
  { text: 'Blog', href: '/blogs-and-news' },
  { text: 'Contact us', href: '/contact-us' },
  { text: 'Home', href: '/' },
];

test('Navigation menu links accessibility', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
  await page.goto(url('/'));
  const mainNav = await getMainNav(page);
  await expect(mainNav.getByRole('link', { name: 'Home', exact: true })).toBeVisible();

  for (const link of NAV_LINKS) {
    await mainNav.getByRole('link', { name: link.text, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${link.href.replace('/', '\\/')}$`));
  }
});
