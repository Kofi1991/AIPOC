const { expect } = require('@playwright/test');
const { BASE_URL, url } = require('./siteConfig');

const MENU_MANAGE_URL = url('/admin/structure/menu/manage/main');
const MENU_ADD_URL = `${MENU_MANAGE_URL}/add`;

// Saving a menu add/edit/reorder/delete form intermittently closes the page a few
// seconds later with no dialog and no crash event — reproduced live, most likely an
// admin-theme status-message auto-dismiss handler mistakenly calling window.close()
// (harmless for a real user; real browsers block self-close on a tab they didn't
// script-open, but Playwright's automation-controlled Chromium honors it). Every
// mutating helper below returns the page to use next — either the same one, or a
// fresh page opened in the same authenticated context if the original died.
async function recoverIfClosed(page, context) {
  if (!page.isClosed()) {
    await page.waitForTimeout(1500).catch(() => {});
  }
  if (page.isClosed()) return context.newPage();
  return page;
}

// Opens a blank tab that is never navigated or interacted with, purely to keep the
// browser context alive. If every "working" page happens to self-close (see above)
// while it's the only page open, Chromium tears down the whole context — this anchor
// guarantees there's always at least one other page, so context.newPage() keeps working.
async function keepContextAlive(context) {
  return context.newPage();
}

async function addMenuLink(page, context, { title, link, parentHref = null }) {
  const url = parentHref ? `${BASE_URL}${parentHref}` : MENU_ADD_URL;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Menu link title').fill(title);
  await page.getByLabel('Link', { exact: true }).fill(link);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  return recoverIfClosed(page, context);
}

// Returns the "Add child" action link's href for the given top-level item, to pass
// as `parentHref` into addMenuLink for creating a nested child item.
async function getAddChildHref(page, parentTitle) {
  await page.goto(MENU_MANAGE_URL, { waitUntil: 'domcontentloaded' });
  const row = page.locator('tr', { hasText: parentTitle });
  await row.getByRole('button', { name: /additional actions/i }).click();
  return row.locator('a').evaluateAll((els) => {
    const el = els.find((e) => e.textContent.trim() === 'Add child');
    return el ? el.getAttribute('href') : null;
  });
}

async function editMenuLinkTitle(page, context, oldTitle, newTitle) {
  await page.goto(MENU_MANAGE_URL, { waitUntil: 'domcontentloaded' });
  const row = page.locator('tr', { hasText: oldTitle });
  await row.locator('a[href*="/edit"]').first().click();
  await page.waitForLoadState('domcontentloaded');
  await page.getByLabel('Menu link title').fill(newTitle);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  return recoverIfClosed(page, context);
}

// Drupal hides the plain <select> weight controls behind a JS drag-and-drop UI by
// default — "Show row weights" reveals them, far more reliable to automate than
// simulating drag events.
async function setMenuLinkWeight(page, context, title, weight) {
  await page.goto(MENU_MANAGE_URL, { waitUntil: 'domcontentloaded' });
  const showWeights = page.getByRole('button', { name: 'Show row weights' });
  if (await showWeights.isVisible().catch(() => false)) await showWeights.click();
  await page.getByLabel(`Weight for ${title}`).selectOption(String(weight));
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  return recoverIfClosed(page, context);
}

// Deletes a menu link by title. The Delete link lives behind the same collapsed
// "additional actions" dropdown as the admin Content list, with the same overlap
// bug — dispatch the click on the DOM node directly (see contentPageHelper.js).
async function deleteMenuLink(page, context, title) {
  await page.goto(MENU_MANAGE_URL, { waitUntil: 'domcontentloaded' });
  const row = page.locator('tr', { hasText: title });
  await row.getByRole('button', { name: /additional actions/i }).click();
  await row.locator('a[href*="/delete"]').evaluate((el) => el.click());
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: /delete|confirm/i }).first().click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  return recoverIfClosed(page, context);
}

async function expectVisibleInFENav(page, title) {
  await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Main navigation').getByRole('link', { name: title, exact: true })).toBeVisible();
}

async function expectNotVisibleInFENav(page, title) {
  await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Main navigation').getByRole('link', { name: title, exact: true })).toHaveCount(0);
}

// Child items only render once their parent is hovered (a hover-revealed dropdown,
// confirmed live — not present in the flat nav list otherwise).
async function expectChildVisibleOnHover(page, parentTitle, childTitle) {
  await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
  const nav = page.getByLabel('Main navigation');
  await nav.getByRole('link', { name: parentTitle, exact: true }).hover();
  await expect(nav.getByRole('link', { name: childTitle, exact: true })).toBeVisible();
}

module.exports = {
  addMenuLink,
  getAddChildHref,
  editMenuLinkTitle,
  setMenuLinkWeight,
  deleteMenuLink,
  expectVisibleInFENav,
  expectNotVisibleInFENav,
  expectChildVisibleOnHover,
  recoverIfClosed,
  keepContextAlive,
};
