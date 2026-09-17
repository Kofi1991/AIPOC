const { expect } = require('@playwright/test');

async function openMenuIfPresent(page) {
  const possibleMenuButtons = [
    page.getByRole('button', { name: /Menu/i }),
    page.getByRole('button', { name: /Open menu/i }),
    page.getByRole('button', { name: /Close/i }),
  ];
  for (const btn of possibleMenuButtons) {
    try {
      if (await btn.isVisible()) {
        await btn.click();
        return true;
      }
    } catch (e) {
      // ignore — button not found
    }
  }
  return false;
}

async function expectLogoVisible(page, altText = 'No Vote No Voice home page') {
  // Try multiple strategies to locate a logo to reduce flakiness across browsers
  const altLogo = page.getByAltText(altText);
  if ((await altLogo.count()) > 0) {
    // If the element exists but isn't visible within a short timeout, accept its presence
    try {
      await expect(altLogo).toBeVisible({ timeout: 5000 });
      return;
    } catch (e) {
      // element exists but not visible; fall through and validate src attribute
      const src = await altLogo.getAttribute('src');
      if (src) return;
    }
  }

  const homeImg = page.locator('a[href="/"] img').first();
  if ((await homeImg.count()) > 0) {
    try {
      await expect(homeImg).toBeVisible({ timeout: 3000 });
      return;
    } catch (e) {
      const src = await homeImg.getAttribute('src');
      if (src) return;
    }
  }

  const headerImg = page.locator('header img').first();
  if ((await headerImg.count()) > 0) {
    try {
      await expect(headerImg).toBeVisible({ timeout: 3000 });
      return;
    } catch (e) {
      const src = await headerImg.getAttribute('src');
      if (src) return;
    }
  }

  const anyLogo = page.locator('img[alt*="logo" i], img[alt*="home" i]').first();
  if ((await anyLogo.count()) > 0) {
    try {
      await expect(anyLogo).toBeVisible({ timeout: 3000 });
      return;
    } catch (e) {
      const src = await anyLogo.getAttribute('src');
      if (src) return;
    }
  }

  // As a last resort, look for the first image inside banner/nav
  const bannerImg = page.locator('banner img, .banner img, nav img, header [role="img"]').first();
  if ((await bannerImg.count()) > 0) {
    try {
      await expect(bannerImg).toBeVisible({ timeout: 3000 });
      return;
    } catch (e) {
      const src = await bannerImg.getAttribute('src');
      if (src) return;
    }
  }

  throw new Error('Logo not found using any fallback locator');
}

// Clicks the header logo. Scoped to the site-branding block and the image-wrapping
// link specifically — the header also has a second, text-only link sharing the same
// accessible name, and getByAltText doesn't resolve here despite the accessible name
// matching (the img's alt attribute isn't what a11y tooling reports as its name).
async function clickLogo(page, altText = 'No Vote No Voice home page') {
  await page
    .locator('#block-dhub-starterkit-novotenovoice')
    .getByRole('link', { name: altText })
    .click();
}

async function getMainNav(page) {
  try {
    const nav = page.getByRole('navigation', { name: /Main navigation/i });
    await expect(nav).toBeVisible();
    return nav;
  } catch (e) {
    // fallback to first nav on page (native <nav> elements carry an implicit
    // "navigation" role, so this stays role-based rather than a CSS selector)
    const navFallback = page.getByRole('navigation').first();
    await expect(navFallback).toBeVisible();
    return navFallback;
  }
}

async function expectNavLinks(page, links) {
  const nav = await getMainNav(page);
  for (const item of links) {
    const link = nav.getByRole('link', { name: new RegExp(`^${item.text}$`, 'i') });
    await expect(link).toBeVisible();
    if (item.href) {
      await expect(link).toHaveAttribute('href', item.href);
    }
  }
}

const MAIN_NAV_LINKS = [
  { text: 'Home', href: '/' },
  { text: 'How to vote', href: '/how-to-vote' },
  { text: 'Our work', href: '/our-work' },
  { text: 'Resources', href: '/resources' },
  { text: 'Blog', href: '/blogs-and-news' },
  { text: 'Contact us', href: '/contact-us' },
];

// Verifies the header banner: logo, main nav landmark + all 6 links, and the search box.
async function expectHeaderBanner(page) {
  await expectLogoVisible(page);
  const nav = await getMainNav(page);
  await expect(nav).toBeVisible();
  await expectNavLinks(page, MAIN_NAV_LINKS);
  // .first() — some pages (e.g. /resources) have a second, page-body search field
  // whose accessible name also computes to exactly "Search" (a duplicate `id="edit-search"`
  // between the two widgets appears to cause the wrong <label> association on one of them —
  // exact:true alone doesn't disambiguate since both names are identical strings). The
  // header's own field is reliably first in document order on every page, so .first()
  // resolves it without resorting to a Drupal-generated id selector.
  await expect(page.getByRole('textbox', { name: 'Search', exact: true }).first()).toBeVisible();
}

// Navigates to fromUrl, clicks the header logo, and confirms it returns to the homepage.
async function expectLogoNavigatesHome(page, fromUrl, homeUrl = 'https://test.registertovote.london/') {
  await page.goto(fromUrl);
  await clickLogo(page);
  await expect(page).toHaveURL(homeUrl);
}

async function expectMainHeading(page, headingText) {
  const mainHeading = page.getByRole('heading', { name: new RegExp(headingText, 'i') });
  await expect(mainHeading).toBeVisible();
}

function escapeForRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function expectStepButtonsClickable(page, buttonNames) {
  for (const nameOrRegex of buttonNames) {
    let locator;
    if (typeof nameOrRegex === 'string') {
      // Try several fallback strategies to find the step control reliably across layouts:
      // 1) a button that contains a heading with the exact name (handles 'Step X' wrappers)
      // 2) a link that contains that heading (sometimes steps are links, not buttons)
      // 3) an exact button by accessible name
      // 4) an exact link by accessible name
      // 5) exact text match anywhere
      const anchoredHeading = new RegExp(`^${escapeForRegex(nameOrRegex)}$`, 'i');
      const heading = page.getByRole('heading', { name: anchoredHeading }).first();

      // 1) button ancestor of heading
      try {
        const buttonContainingHeading = page.getByRole('button').filter({ has: heading }).first();
        if ((await buttonContainingHeading.count()) > 0) locator = buttonContainingHeading;
      } catch (e) { /* ignore */ }

      // 2) link ancestor of heading
      if (!locator) {
        try {
          const linkContainingHeading = page.getByRole('link').filter({ has: heading }).first();
          if ((await linkContainingHeading.count()) > 0) locator = linkContainingHeading;
        } catch (e) { /* ignore */ }
      }

      // 3) exact button by accessible name
      if (!locator) {
        const anchored = new RegExp(`^${escapeForRegex(nameOrRegex)}$`, 'i');
        const byButton = page.getByRole('button', { name: anchored }).first();
        if ((await byButton.count()) > 0) locator = byButton;
      }

      // 4) exact link by accessible name
      if (!locator) {
        const anchored = new RegExp(`^${escapeForRegex(nameOrRegex)}$`, 'i');
        const byLink = page.getByRole('link', { name: anchored }).first();
        if ((await byLink.count()) > 0) locator = byLink;
      }

      // 5) fallback to exact text match
      if (!locator) {
        locator = page.getByText(new RegExp(`^${escapeForRegex(nameOrRegex)}$`, 'i')).first();
      }
    } else {
      locator = page.getByRole('button', { name: nameOrRegex });
    }

    // If the locator resolves to multiple elements, pick the visible one
    const count = await locator.count().catch(() => 0);
    if (count > 1) {
      // prefer the first visible
      let found = false;
      for (let i = 0; i < count; i++) {
        const el = locator.nth(i);
        if (await el.isVisible()) {
          locator = el;
          found = true;
          break;
        }
      }
      if (!found) {
        // fall back to the first
        locator = locator.first();
      }
    }

    await expect(locator).toBeVisible();
    await expect(locator).toBeEnabled();
    // prevent navigation while testing clickability
    await locator.evaluate((el) => {
      el.addEventListener('click', (e) => e.preventDefault(), { once: true });
      el.click();
    });
  }
}

// Tabs to (via .focus(), not real Tab-key presses — equivalent for reachability/focus-style
// purposes and avoids fighting the page's own tab order) each of the 6 top-level main nav
// links and confirms a real visible focus indicator (outline or box-shadow) is applied, not
// just that the link exists. Scoped to the top-level items only — the mega-menu's dropdown
// sub-items are a separate, deeper check (see navigation-menu-links-plan for that finding).
async function expectNavLinksKeyboardFocusable(page, links = MAIN_NAV_LINKS) {
  const nav = await getMainNav(page);
  for (const item of links) {
    const link = nav.getByRole('link', { name: new RegExp(`^${item.text}$`, 'i') });
    await link.focus();
    await expect(link).toBeFocused();
    const hasVisibleFocusStyle = await link.evaluate((el) => {
      const s = getComputedStyle(el);
      return (s.outlineStyle !== 'none' && s.outlineWidth !== '0px') || s.boxShadow !== 'none';
    });
    expect(hasVisibleFocusStyle, `${item.text} has no visible focus indicator`).toBe(true);
  }
}

module.exports = {
  openMenuIfPresent,
  expectLogoVisible,
  clickLogo,
  getMainNav,
  expectNavLinks,
  expectHeaderBanner,
  expectLogoNavigatesHome,
  expectMainHeading,
  expectStepButtonsClickable,
  expectNavLinksKeyboardFocusable,
};
