#!/usr/bin/env node
// Logs into staging once through the real login form, then saves the resulting Drupal
// session cookie into .env as TC_ADMIN_SESSION. Every spec and agent reuses that one
// session for the rest of the day instead of logging in again — the admin account only
// allows one live session, so repeated form logins keep kicking each other out.
//
// Usage: npm run session        (or: node tools/refresh-session.js)
//
// Deliberately never logs out afterwards — that would end the session being saved.

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ENV_PATH = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: ENV_PATH, quiet: true });

const BASE_URL = 'https://test.registertovote.london';

function upsertEnvVar(file, key, value) {
  const original = fs.readFileSync(file, 'utf8');
  const lines = original.split('\n');
  const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (idx >= 0) {
    lines[idx] = `${key}=${value}`;
  } else {
    if (lines[lines.length - 1] === '') lines.pop();
    lines.push(`${key}=${value}`, '');
  }

  // Write to a temp file and rename, so a crash can't leave .env half-written; keep the
  // original file mode (.env is 600 — it holds secrets).
  const mode = fs.statSync(file).mode & 0o777;
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, lines.join('\n'), { mode });
  fs.renameSync(tmp, file);
}

async function main() {
  const { TC_ADMIN_USER, TC_ADMIN_PASS } = process.env;
  if (!TC_ADMIN_USER || !TC_ADMIN_PASS) {
    console.error('TC_ADMIN_USER / TC_ADMIN_PASS are missing from .env — nothing to log in with.');
    process.exit(1);
  }

  // Force a genuine form login: authHelper.login() short-circuits to cookie injection
  // whenever TC_ADMIN_SESSION is set, which is exactly what we're replacing.
  delete process.env.TC_ADMIN_SESSION;
  const { login } = require('../tests/helpers/authHelper');

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`Logging in as ${TC_ADMIN_USER} ...`);
    try {
      await login(page, TC_ADMIN_USER, TC_ADMIN_PASS);
    } catch (e) {
      const msg = e.message.split('\n')[0];
      console.error(`\nLogin failed: ${msg}`);
      if (/Session Limit/i.test(msg)) {
        console.error(
          'The account already has a live session somewhere (another browser, a running test).\n' +
            'End it or wait for it to expire, then run this again.'
        );
      }
      process.exit(1);
    }

    const session = (await context.cookies(BASE_URL)).find((c) => /^S?SESS/.test(c.name));
    if (!session) {
      console.error('Logged in, but no Drupal session cookie (SSESS…/SESS…) was found — .env left unchanged.');
      process.exit(1);
    }

    upsertEnvVar(ENV_PATH, 'TC_ADMIN_SESSION', `${session.name}=${session.value}`);
    console.log(`Saved ${session.name} to .env as TC_ADMIN_SESSION (${session.value.length}-char value, not printed).`);
    console.log('Session left open on purpose — do not log out of it. Specs and agents will reuse it.');
  } finally {
    await browser.close();
  }
}

main();
