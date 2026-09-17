const { expect } = require('@playwright/test');

async function getFooter(page) {
  // Prefer landmark role if available
  try {
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    return footer;
  } catch (e) {
    const footerFallback = page.locator('footer').first();
    await expect(footerFallback).toBeVisible();
    return footerFallback;
  }
}

async function expectFooterLogoVisible(page, altText = 'GLA Democracy Hub') {
  const footer = await getFooter(page);
  const logo = footer.getByAltText(altText);
  await expect(logo).toBeVisible();
}

async function expectContactInfo(page) {
  const footer = await getFooter(page);
  // Address text
  await expect(footer).toContainText('City Hall');
  await expect(footer).toContainText('Kamal Chunchie Way');
  await expect(footer).toContainText('London');
  await expect(footer).toContainText('E16 1ZE');

  // Email link
  const email = footer.getByRole('link', { name: /democracy@london.gov.uk/i });
  await expect(email).toBeVisible();
  await expect(email).toHaveAttribute('href', 'mailto:democracy@london.gov.uk');
}

async function expectFooterLinks(page, expectedLinks) {
  const footer = await getFooter(page);
  for (const item of expectedLinks) {
    const link = footer.getByRole('link', { name: new RegExp(`^${item.text}$`, 'i') });
    await expect(link).toBeVisible();
    if (item.href) {
      await expect(link).toHaveAttribute('href', item.href);
    }
  }
}

async function expectSocialLinks(page, socialLinks) {
  const footer = await getFooter(page);
  for (const s of socialLinks) {
    const link = footer.getByRole('link', { name: new RegExp(s.name, 'i') });
    await expect(link).toBeVisible();
    if (s.href) {
      await expect(link).toHaveAttribute('href', s.href);
    }
    if (s.opensNewWindow) {
      await expect(link).toHaveAttribute('target', '_blank');
    }
  }
}

const FOOTER_NAV_LINKS = [
  { text: 'Accessibility statement', href: '/accessibility-statement-democracy-hub' },
  { text: 'Privacy and cookie policy', href: '/privacy-policy' },
  { text: 'Terms and conditions', href: '/terms-and-conditions' },
  { text: 'BSL and Easy Read resources', href: '/bsl-and-easy-read-resources' },
  { text: 'Free Voter Authority Certificate', href: '/free-voter-authority-certificate' },
  { text: 'How to vote', href: '/how-to-vote' },
  { text: 'Impartiality toolkit', href: '/our-work/impartiality-and-governance/impartiality-toolkit' },
  { text: 'Register to vote anonymously', href: '/register-vote-anonymously' },
  { text: 'Voting at a polling station', href: '/how-to-vote/ways-to-vote/voting-at-polling-station' },
  { text: 'Blog', href: '/blogs-and-news' },
  { text: 'Contact us', href: '/contact-us' },
  { text: 'Our partners', href: '/our-partners' },
  { text: 'Our work', href: '/our-work' },
  { text: 'Resources', href: '/resources' },
];

// Clicks the footer email link and closes any mail-client popup it spawns
// (headless environments typically don't open one, which is fine).
async function clickEmailLink(page) {
  const footer = await getFooter(page);
  const emailLink = footer.getByRole('link', { name: /democracy@london.gov.uk/i });
  const popupPromise = page.context().waitForEvent('page').catch(() => null);
  await emailLink.click();
  const popup = await Promise.race([popupPromise, new Promise((resolve) => setTimeout(() => resolve(null), 2000))]);
  if (popup) {
    await popup.close();
  }
}

// Verifies logo, contact info, and every footer nav link in one call.
async function expectFooterComplete(page) {
  await expectFooterLogoVisible(page);
  await expectContactInfo(page);
  await expectFooterLinks(page, FOOTER_NAV_LINKS);
}

const CONNECT_WITH_US_LINKS = [
  { name: 'Facebook', href: 'https://www.facebook.com/LDNgov', opensNewWindow: true },
  { name: 'Youtube', href: 'https://www.youtube.com/@London_Gov', opensNewWindow: true },
  { name: 'Whatsapp Channel', href: 'https://www.whatsapp.com/channel/0029VaZfd6M6mYPOJRvfap3l', opensNewWindow: true },
  { name: 'Instagram', href: 'https://www.instagram.com/ldn_gov', opensNewWindow: true },
  { name: 'X', href: 'https://x.com/ldn_gov', opensNewWindow: true },
];

// Verifies the 'Connect with us' heading and all 5 social icons (name, href, new-tab).
async function expectConnectWithUsSection(page) {
  const footer = await getFooter(page);
  await expect(footer.getByRole('heading', { name: 'Connect with us' })).toBeVisible();
  await expectSocialLinks(page, CONNECT_WITH_US_LINKS);
}

module.exports = {
  getFooter,
  expectFooterLogoVisible,
  expectContactInfo,
  expectFooterLinks,
  expectSocialLinks,
  expectFooterComplete,
  clickEmailLink,
  expectConnectWithUsSection,
};
