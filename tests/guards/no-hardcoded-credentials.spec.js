// Static guard, not a browser test: scans every spec/helper for a credential literal
// passed to a login helper where an env var belongs. Grew out of a promptfoo eval
// assertion (promptfooconfig.yaml) that checks the same thing for LLM-generated
// scripts — this is the equivalent check for what's actually committed.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.join(__dirname, '..');
const CREDENTIAL_FUNCTIONS = ['login', 'attemptInvalidLogin', 'loginWithMathChallenge'];

function listJsFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listJsFiles(full, out);
    } else if (entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

test('no hardcoded credential literals passed to auth helpers', { tag: ['@smoke', '@regression'] }, () => {
  // fn(page, <username>, <password>) — flag a quoted-string literal in the password
  // position specifically; a hardcoded username (e.g. a test email) isn't a secret.
  const callPattern = new RegExp(
    `\\b(?:${CREDENTIAL_FUNCTIONS.join('|')})\\s*\\([^,]+,[^,]+,\\s*(['"\`])((?:(?!\\1).)*)\\1`,
    'g'
  );

  const violations = [];
  for (const file of listJsFiles(TESTS_DIR)) {
    const source = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = callPattern.exec(source))) {
      const relPath = path.relative(path.join(__dirname, '..', '..'), file);
      violations.push(`${relPath}: hardcoded password literal "${match[2]}" — pass it via process.env instead`);
    }
  }

  expect(violations, violations.join('\n')).toEqual([]);
});
