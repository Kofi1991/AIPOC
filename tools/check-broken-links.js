#!/usr/bin/env node
// Crawls the site as an anonymous (not logged in) user, starting from the homepage,
// and reports broken links. Internal pages (same origin) are crawled breadth-first;
// external links are checked for status but not followed further.
//
// Usage: node tools/check-broken-links.js [--max-pages=200] [--base=<url>]
// Defaults to TC_BASE_URL (see tests/helpers/siteConfig.js), i.e. staging unless told otherwise.

const { chromium } = require('@playwright/test');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const BASE = args.base || require('../tests/helpers/siteConfig').BASE_URL;
const MAX_PAGES = parseInt(args['max-pages'] || '200', 10);
const ORIGIN = new URL(BASE).origin;

function shouldSkip(href) {
  if (!href) return true;
  return /^(mailto:|tel:|javascript:|#)/i.test(href.trim());
}

function normalize(href, baseUrl) {
  try {
    const u = new URL(href, baseUrl);
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

async function main() {
  const browser = await chromium.launch();
  // Fresh, cookie-less context — anonymous user, no session/auth.
  const context = await browser.newContext();
  const page = await context.newPage();
  const checkerPage = await context.newPage(); // dedicated tab for external link checks

  const visited = new Set();
  const queue = [BASE + '/'];
  const linkChecked = new Map(); // url -> { status, error, referrers: Set }
  const brokenPages = []; // internal pages that themselves failed to load during crawl

  async function checkLink(url, referrer) {
    if (linkChecked.has(url)) {
      linkChecked.get(url).referrers.add(referrer);
      return linkChecked.get(url);
    }
    const entry = { status: null, error: null, referrers: new Set([referrer]) };
    linkChecked.set(url, entry);
    try {
      // Real navigation, not a bare HTTP request — plain requests get false-positive
      // 403/400s from sites with bot detection (verified: Facebook returns 400 to a
      // raw request but 200 to an actual browser navigation for the same URL).
      const res = await checkerPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      entry.status = res ? res.status() : null;
    } catch (e) {
      const msg = e.message.split('\n')[0];
      if (/Download is starting/i.test(msg)) {
        // The link is valid — it points at a downloadable file page.goto() can't
        // render. Fall back to a plain HTTP request just to confirm it resolves.
        try {
          const res = await context.request.get(url, { maxRedirects: 5, timeout: 15000 });
          entry.status = res.status();
        } catch (e2) {
          entry.error = e2.message.split('\n')[0];
        }
      } else {
        entry.error = msg;
      }
    }
    return entry;
  }

  let pagesCrawled = 0;
  while (queue.length > 0 && pagesCrawled < MAX_PAGES) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    pagesCrawled++;

    let hrefs = [];
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const status = res ? res.status() : null;
      if (!res || status >= 400) {
        brokenPages.push({ url, status, referrer: null });
      }
      hrefs = await page.$$eval('a[href]', (els) => els.map((el) => el.getAttribute('href')));
    } catch (e) {
      const msg = e.message.split('\n')[0];
      if (/Download is starting/i.test(msg)) {
        // Not a broken page — the URL points straight at a downloadable file (PDF etc.),
        // which page.goto() can't render. Verify it separately via a plain HTTP check.
        const entry = await checkLink(url, '(direct file link)');
        if (entry.error || (entry.status && entry.status >= 400)) {
          brokenPages.push({ url, status: entry.status, error: entry.error });
        }
      } else {
        brokenPages.push({ url, status: null, error: msg });
      }
      continue;
    }

    for (const href of hrefs) {
      if (shouldSkip(href)) continue;
      const abs = normalize(href, url);
      if (!abs) continue;

      const isInternal = new URL(abs).origin === ORIGIN;
      if (isInternal) {
        if (!visited.has(abs) && !queue.includes(abs)) queue.push(abs);
      } else {
        await checkLink(abs, url);
      }
    }
    process.stderr.write(`Crawled ${pagesCrawled}: ${url}\n`);
  }

  // Also explicitly status-check every visited internal page (already navigated,
  // but record status uniformly alongside external links for the report).
  for (const url of visited) {
    if (!linkChecked.has(url)) {
      const entry = { status: null, error: null, referrers: new Set(['(crawled directly)']) };
      linkChecked.set(url, entry);
    }
  }

  await browser.close();

  const confirmedBroken = [];
  const likelyFalsePositive = [];
  for (const [url, entry] of linkChecked) {
    if (!entry.error && (!entry.status || entry.status < 400)) continue;
    const isInternal = new URL(url).origin === ORIGIN;
    const item = { url, status: entry.status, error: entry.error, referrers: [...entry.referrers] };
    // A 403 on an EXTERNAL link is ambiguous — cannot be reliably told apart from
    // headless-browser bot detection without detection-evasion techniques (confirmed:
    // x.com and electoralcommission.org.uk both 403 a plain Playwright navigation).
    // A 403 on our OWN site is never ambiguous — it's a real bug either way.
    if (entry.status === 403 && !isInternal) {
      likelyFalsePositive.push(item);
    } else {
      confirmedBroken.push(item);
    }
  }
  const brokenInternal = confirmedBroken.filter((b) => new URL(b.url).origin === ORIGIN);
  const brokenExternal = confirmedBroken.filter((b) => new URL(b.url).origin !== ORIGIN);

  console.log('\n=== Broken Links Report (anonymous user) ===');
  console.log(`Base: ${BASE}`);
  console.log(`Internal pages crawled: ${pagesCrawled}`);
  console.log(`Total links checked (internal pages + external links): ${linkChecked.size}`);
  console.log(`Broken pages hit during crawl: ${brokenPages.length}`);
  console.log(`Confirmed broken links: ${confirmedBroken.length} (${brokenInternal.length} internal, ${brokenExternal.length} external)`);
  console.log(`Likely false positives (bot-defensive external sites, e.g. X/Twitter): ${likelyFalsePositive.length}\n`);

  if (brokenPages.length) {
    console.log('--- Pages that failed to load during crawl ---');
    for (const p of brokenPages) {
      console.log(`${p.status || 'ERROR'}  ${p.url}${p.error ? '  (' + p.error + ')' : ''}`);
    }
    console.log('');
  }

  if (brokenInternal.length) {
    console.log('--- Confirmed broken INTERNAL links (on this site, fully actionable) ---');
    for (const b of brokenInternal) {
      console.log(`${b.status || 'ERROR'}  ${b.url}`);
      console.log(`   linked from: ${b.referrers.slice(0, 3).join(', ')}${b.referrers.length > 3 ? ` (+${b.referrers.length - 3} more)` : ''}`);
    }
    console.log('');
  }

  if (brokenExternal.length) {
    console.log('--- Confirmed broken EXTERNAL links ---');
    for (const b of brokenExternal) {
      console.log(`${b.status || 'ERROR'}  ${b.url}`);
      console.log(`   linked from: ${b.referrers.slice(0, 3).join(', ')}${b.referrers.length > 3 ? ` (+${b.referrers.length - 3} more)` : ''}`);
    }
    console.log('');
  }

  if (likelyFalsePositive.length) {
    console.log('--- Likely false positives (verify manually in a real browser before reporting) ---');
    for (const b of likelyFalsePositive) {
      console.log(`${b.status}  ${b.url}  (linked from ${b.referrers.length} page(s))`);
    }
    console.log('');
  }

  if (!confirmedBroken.length) {
    console.log('No confirmed broken links found.');
  }

  require('fs').writeFileSync(
    'reports/broken-links-report.json',
    JSON.stringify(
      {
        base: BASE,
        pagesCrawled,
        totalLinksChecked: linkChecked.size,
        brokenPages,
        confirmedBroken,
        likelyFalsePositive,
      },
      null,
      2
    )
  );
  console.log('\nFull report written to reports/broken-links-report.json');
}

main();
