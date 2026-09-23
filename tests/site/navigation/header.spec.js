const { test } = require('@playwright/test');
const navHelper = require('../../helpers/navHelper');
const { BASE_URL } = require('../../helpers/siteConfig');

test('header has logo and top menu links; main heading and step buttons are interactive (reusable helpers)', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // open menu if the page has a collapsed responsive menu
  await navHelper.openMenuIfPresent(page);

  // logo
  await navHelper.expectLogoVisible(page);

  // navigation links
  const links = [
    { text: 'Home', href: '/' },
    { text: 'How to vote', href: '/how-to-vote' },
    { text: 'Our work', href: '/our-work' },
    { text: 'Resources', href: '/resources' },
    { text: 'Blog', href: '/blogs-and-news' },
    { text: 'Contact us', href: '/contact-us' },
  ];
  await navHelper.expectNavLinks(page, links);

  // main heading
  await navHelper.expectMainHeading(page, 'Democracy Hub: Every Voice Matters');

  // step buttons: Register, Voter ID, Vote
  // Use exact names to avoid ambiguous matches (regex like /Vote/i may match 'Voter ID')
  await navHelper.expectStepButtonsClickable(page, ['Register', 'Voter ID', 'Vote']);
});
