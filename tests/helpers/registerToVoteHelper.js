const { expect } = require('@playwright/test');
const { expandStep } = require('./homeAccordionHelper');

const REGISTER_URL = 'https://test.registertovote.london/how-to-vote/register-to-vote';

// The three outbound links on the Register to vote page. All open in a new tab.
const EXTERNAL_LINKS = [
  { name: 'Register to vote now', href: 'https://www.gov.uk/register-to-vote' },
  {
    name: 'Check if you can register and vote',
    href: 'https://www.electoralcommission.org.uk/voting-and-elections/who-can-vote',
    // The site redirects this href to a longer path (/who-can-vote-uk-elections).
    landsOn: /^https:\/\/www\.electoralcommission\.org\.uk\/voting-and-elections\/who-can-vote/,
  },
  { name: 'Find out more about voting rights', href: 'https://www.gov.uk/elections-in-the-uk' },
];

// The help accordions and a snippet of each one's real panel text, used to confirm the panel
// actually shows — not just that aria-expanded flipped. (Their aria-controls ids don't exist
// in the page, so the panel can't be found through that attribute.)
const HELP_SECTIONS = [
  { name: 'Anonymous voter registration', text: 'If you are worried about your safety' },
  { name: 'Register without using the internet', text: 'You can print a register to vote form' },
  { name: 'Register if you have no fixed or permanent address', text: 'experiencing homelessness' },
];

// Checks the link's destination and new-tab target, then clicks it and confirms the new tab
// heads to that URL. Waits only for the navigation to *commit*: the Electoral Commission site
// blocks headless browsers (403), so the third-party page's content or status is never relied on.
async function expectExternalLinkOpensNewTab(page, { name, href, landsOn = href }) {
  const link = page.getByRole('link', { name });
  await expect(link).toHaveAttribute('href', href);
  await expect(link).toHaveAttribute('target', '_blank');

  const [newTab] = await Promise.all([page.context().waitForEvent('page'), link.click()]);
  await newTab.waitForURL(landsOn, { waitUntil: 'commit' });
  await newTab.close();
}

async function expandHelpSection(page, section) {
  await expandStep(page, section.name);
  await expect(page.getByText(section.text)).toBeVisible();
}

module.exports = {
  REGISTER_URL,
  EXTERNAL_LINKS,
  HELP_SECTIONS,
  expectExternalLinkOpensNewTab,
  expandHelpSection,
};
