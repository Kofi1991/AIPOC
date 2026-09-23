// case: none (repo guard, not a TestCollab case)
// Static guard, not a browser test: every spec must name the TestCollab case it automates.
//
// The `// spec:` header names a *plan*, and one plan covers many cases — 27 specs share
// tc-1578356-1578402-content-types-plan.md alone — so it cannot identify which case a given
// spec is for. Two things depend on that identification: the burndown count in
// reports/burndown-data.json (recomputed from these headers by tools/record_run_history.py),
// and the QA agent, which tags a case `automated` in TestCollab once its spec passes. A
// missing or duplicated header silently corrupts both, which is why this is a test and not a
// convention.

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.join(__dirname, '..');
const REPO_ROOT = path.join(__dirname, '..', '..');
const HEADER_LINES = 5;

// `// case: TC-1578397`  or  `// case: none (ad-hoc login check, no TestCollab case)`
const CASE_ID = /^\/\/ case: TC-(\d+)\s*$/;
const CASE_NONE = /^\/\/ case: none \(.+\)\s*$/;

function listSpecFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listSpecFiles(full, out);
    } else if (entry.name.endsWith('.spec.js')) {
      out.push(full);
    }
  }
  return out;
}

function howToFix(relPath) {
  return [
    `  ${relPath}`,
    '    Add one of these as the FIRST line of the file:',
    '      // case: TC-<id>            <- the TestCollab case this spec automates',
    '      // case: none (<reason>)    <- if it genuinely has no case, say why',
    "    The id is in the 'Coverage summary' table of the plan named in the file's // spec: header.",
  ].join('\n');
}

test('every spec names the TestCollab case it automates', { tag: ['@smoke', '@regression'] }, () => {
  const problems = [];
  const idOwners = new Map(); // TC id -> [spec files claiming it]

  for (const file of listSpecFiles(TESTS_DIR)) {
    const relPath = path.relative(REPO_ROOT, file);
    const header = fs.readFileSync(file, 'utf8').split('\n').slice(0, HEADER_LINES);

    const idLine = header.find((line) => CASE_ID.test(line));
    const noneLine = header.find((line) => CASE_NONE.test(line));

    if (!idLine && !noneLine) {
      const malformed = header.find((line) => line.trim().startsWith('// case:'));
      problems.push(
        malformed
          ? `${howToFix(relPath)}\n    Found instead: ${malformed.trim()}`
          : howToFix(relPath)
      );
      continue;
    }
    if (idLine) {
      const id = idLine.match(CASE_ID)[1];
      idOwners.set(id, [...(idOwners.get(id) || []), relPath]);
    }
  }

  for (const [id, owners] of idOwners) {
    if (owners.length > 1) {
      problems.push(
        [
          `  TC-${id} is claimed by ${owners.length} specs:`,
          ...owners.map((o) => `    ${o}`),
          '    One case, one spec. Point the duplicates at their own case id, or mark the',
          '    redundant one: // case: none (<reason>; TC-<id> is covered by <other spec>)',
        ].join('\n')
      );
    }
  }

  expect(problems, ['Spec traceability problems:', ...problems].join('\n')).toEqual([]);
});
