const { expect } = require('@playwright/test');
const { BASE_URL, url } = require('./siteConfig');

// Ensure cookies are accepted before any authenticated flow.
//   1. Pre-seed the Civic Cookie Control consent cookie so the site treats consent as
//      granted (the widget itself is unreliable on staging and sometimes never renders).
//   2. Load the site root so Drupal issues its session cookie and the browser stores it,
//      then confirm a cookie for the domain actually came back. Without this round-trip
//      Drupal's post-login check (`/user/{uid}?check_logged_in=1`) reports
//      "your browser must accept cookies from the domain ...".
async function acceptCookies(page) {
  const consent = JSON.stringify({
    optionalCookies: { analytics: 'revoked', marketing: 'revoked' },
    statement: {},
    consentDate: Date.now(),
    consentExpiry: 90,
    interactedWith: true,
  });
  await page.context().addCookies([
    { name: 'CookieControl', value: consent, domain: '.test.registertovote.london', path: '/' },
  ]);

  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  const cookies = await page.context().cookies(BASE_URL);
  expect(cookies.length, 'Browser accepted no cookies from test.registertovote.london').toBeGreaterThan(0);
}

// True when a pre-existing Drupal session is supplied via TC_ADMIN_SESSION. In that
// mode the tests reuse that session and must NOT log out (it isn't ours to end).
function hasExistingSession() {
  return Boolean(process.env.TC_ADMIN_SESSION && process.env.TC_ADMIN_SESSION.includes('='));
}

// Inject a pre-existing Drupal session cookie (TC_ADMIN_SESSION="SSESS...=value")
// instead of logging in through the form. Avoids creating a new session, so the
// account's single-session limit is never tripped.
async function useExistingSession(page) {
  await acceptCookies(page);

  const eq = process.env.TC_ADMIN_SESSION.indexOf('=');
  const name = process.env.TC_ADMIN_SESSION.slice(0, eq).trim();
  const value = process.env.TC_ADMIN_SESSION.slice(eq + 1).trim();
  await page.context().addCookies([
    { name, value, domain: '.test.registertovote.london', path: '/', httpOnly: true, secure: true, sameSite: 'Lax' },
  ]);

  await page.goto(`${BASE_URL}/user`, { waitUntil: 'domcontentloaded' });
  await expect(page, 'TC_ADMIN_SESSION is not a valid/live session — redirected to login').not.toHaveURL(/\/user\/login/);
  const sessionCookie = (await page.context().cookies(BASE_URL)).find((c) => /^S?SESS/.test(c.name));
  expect(sessionCookie, 'Injected session cookie was rejected by the server').toBeTruthy();
}

// Standard login helper for valid credentials: fills the form, submits, answers the
// anti-bot math challenge if it appears (retrying up to 5 times), and asserts the
// login succeeded (navigated away from /user/login). Use this for any flow that
// needs a real, logged-in session.
async function login(page, username, password) {
  if (hasExistingSession()) {
    await useExistingSession(page);
    return;
  }

  await acceptCookies(page);

  await page.goto(url('/user/login'), { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  // The anti-bot math challenge appears after a submit and clears the password field, so the
  // password has to be re-entered alongside the answer. It can reappear with a new question on
  // consecutive submits, so keep answering it until it clears or we give up retrying.
  //
  // Critical: once a submit has actually logged us in (URL left /user/login), STOP. Submitting
  // the form again creates a second session, and Drupal Session Limit then disconnects the
  // first one — the login appears to succeed then immediately shows "you have been logged out".
  const mathQuestion = page.getByText(/Math question \((\d+)\s*([+\-*/])\s*(\d+)\s*=\)/);
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.waitForLoadState('domcontentloaded');
    if (!/\/user\/login/.test(page.url())) break;
    if (!(await mathQuestion.isVisible().catch(() => false))) break;

    const [, a, operator, b] = (await mathQuestion.textContent()).match(/\((\d+)\s*([+\-*/])\s*(\d+)\s*=\)/);
    const answer = { '+': (x, y) => x + y, '-': (x, y) => x - y, '*': (x, y) => x * y, '/': (x, y) => x / y }[operator](
      Number(a),
      Number(b)
    );

    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('textbox', { name: /Math question/ }).fill(String(answer));
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForLoadState('domcontentloaded');
  }

  await expect(page).not.toHaveURL(/\/user\/login/);

  // A redirect away from /user/login is not proof of a live session: Drupal's Session
  // Limit module can immediately terminate it if the account already has an active
  // session elsewhere. Fail loudly with the real reason instead of a confusing
  // "element not found" later in the test.
  const killed = page
    .getByText(/maximum number of \d+ simultaneous session|your browser must accept cookies/i)
    .first();
  if (await killed.isVisible().catch(() => false)) {
    throw new Error(
      'Login succeeded but the session was immediately terminated by Drupal Session Limit ' +
        '(the account already has an active session elsewhere). Cookies ARE being accepted — ' +
        'this is a single-session cap. Use a dedicated automation account or raise its limit, ' +
        'and wait for stale sessions from earlier runs to expire.'
    );
  }

  // Confirm the authenticated Drupal session cookie is actually held by the browser.
  const sessionCookie = (await page.context().cookies(BASE_URL)).find((c) => /^S?SESS/.test(c.name));
  expect(sessionCookie, 'No Drupal session cookie after login — cookies are not being accepted').toBeTruthy();
}

// Login helper for credentials expected to FAIL (e.g. wrong password, fake account).
// Same anti-bot retry pattern as login(), but does not assert success — the caller
// asserts on whatever error state results instead.
async function attemptInvalidLogin(page, username, password) {
  await page.goto(url('/user/login'), { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  const mathQuestion = page.getByText(/Math question \((\d+)\s*([+\-*/])\s*(\d+)\s*=\)/);
  for (let attempt = 0; attempt < 5 && (await mathQuestion.isVisible().catch(() => false)); attempt++) {
    const [, a, operator, b] = (await mathQuestion.textContent()).match(/\((\d+)\s*([+\-*/])\s*(\d+)\s*=\)/);
    const answer = { '+': (x, y) => x + y, '-': (x, y) => x - y, '*': (x, y) => x * y, '/': (x, y) => x / y }[operator](
      Number(a),
      Number(b)
    );

    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('textbox', { name: /Math question/ }).fill(String(answer));
    await page.getByRole('button', { name: 'Log in' }).click();
  }
}

// Ends the server-side session. Modern Drupal no longer logs out on a bare GET to
// /user/logout — it shows a "Log out" confirmation — so click that through, then
// verify we're actually anonymous. Leaving sessions alive burns the account's
// single-session slot for every following run.
async function logout(page) {
  // Never end a session that was handed to us via TC_ADMIN_SESSION.
  if (hasExistingSession()) {
    await page.context().clearCookies();
    return;
  }

  await page.goto(url('/user/logout'), { waitUntil: 'domcontentloaded' });

  const confirm = page.getByRole('button', { name: /^Log out$/ }).or(page.getByRole('link', { name: /^Log out$/ }));
  if (await confirm.first().isVisible().catch(() => false)) {
    await confirm.first().click();
    await page.waitForLoadState('domcontentloaded');
  }

  // Confirm the session cookie is gone.
  await page.goto(url('/'), { waitUntil: 'domcontentloaded' });
  const stillLoggedIn = (await page.context().cookies(BASE_URL)).some((c) => /^S?SESS/.test(c.name));
  if (stillLoggedIn) {
    await page.context().clearCookies();
  }
}

// From an already-logged-in page, navigates through "Add content" > "News article /
// Blog post" to reach the blog creation form. Tries several selector fallbacks at each
// step since the exact link/button markup isn't guaranteed.
async function navigateToBlogCreation(page) {
  // Go straight to the content-type chooser rather than hunting for an "Add content"
  // toolbar link, whose markup varies by page and theme.
  await page.goto(url('/node/add'), { waitUntil: 'domcontentloaded' });

  // Click on "News article / Blog post" option
  const blogPostLocators = [
    page.getByRole('link', { name: 'News article' }),
    page.getByRole('link', { name: 'Blog post' }),
    page.getByRole('link', { name: /News article.*Blog post|Blog post.*News/ }),
    page.locator('li').filter({ hasText: /News article.*Blog post|Blog post/ }), // no interactive role on a bare <li>
  ];

  let found = false;
  for (const locator of blogPostLocators) {
    const element = locator.first();
    if (await element.count() > 0) {
      await element.click();
      console.log('✓ Clicked "News article / Blog post"');
      found = true;
      break;
    }
  }
  
  if (!found) {
    throw new Error('Could not find "News article / Blog post" option');
  }

  // Wait for blog creation form to load
  await page.waitForSelector('form, input[type="text"]', { timeout: 5000 });
  await dismissAutosaveDialog(page);
  console.log('✓ Blog creation form loaded');
}

// Drupal's autosave shows a "Resume editing / Discard" dialog over the node form when
// it finds an unsaved draft from a previous session. It overlays the page and swallows
// clicks, so dismiss it (Discard = start from a clean form) before touching any field.
async function dismissAutosaveDialog(page) {
  const discard = page.getByRole('button', { name: /^Discard$/ });
  if (await discard.isVisible().catch(() => false)) {
    await discard.click();
    await expect(discard).toBeHidden();
    console.log('✓ Dismissed autosave "Resume editing" dialog');
  }
}

// acceptCookies: pre-grants cookie consent and verifies the browser stores cookies
// login: standard login for valid credentials, asserts success
// attemptInvalidLogin: login for credentials expected to fail, no success assertion
// logout: ends the session
// navigateToBlogCreation: from a logged-in page, reaches the blog creation form
module.exports = {
  acceptCookies,
  hasExistingSession,
  useExistingSession,
  login,
  attemptInvalidLogin,
  logout,
  navigateToBlogCreation,
  dismissAutosaveDialog,
};
