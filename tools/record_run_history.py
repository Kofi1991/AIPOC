#!/usr/bin/env python3
"""
Append the latest test run's results to reports/run-history.json.

Usage:
  python3 tools/record_run_history.py

Reads:
  test-results/junit.xml   (written by the 'junit' reporter in playwright.config.js)

Writes:
  reports/run-history.json                    { runs: [ {...}, ... ] }
  reports/run-history-artifacts/<run-id>/...  (screenshots/videos/traces copied out of
                                              test-results/ before the next run wipes it)

Each run is appended, not overwritten, so this file accumulates history across
every `npm test` invocation. junit.xml itself is overwritten each run by the
reporter, so this script must run immediately after each test run to capture it.

Runs older than RETENTION_DAYS (45) are pruned on every invocation, along with
their copied artifacts — there's no hard cap on run *count*, just on age.

Deliberately written to specs/, not test-results/ — Playwright wipes its
outputDir (test-results/) at the start of every run, which would silently
erase accumulated history (and copied artifacts) if they lived there.
"""
import xml.etree.ElementTree as ET
import re
import json
import os
import shutil
from datetime import datetime, timezone, timedelta

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
JUNIT = os.path.join(ROOT, 'test-results', 'junit.xml')
TEST_RESULTS_DIR = os.path.join(ROOT, 'test-results')
OUT = os.path.join(ROOT, 'reports', 'run-history.json')
ARTIFACTS_ROOT = os.path.join(ROOT, 'reports', 'run-history-artifacts')
RETENTION_DAYS = 45

ATTACHMENT_TYPES = {
    '.png': 'screenshot',
    '.jpg': 'screenshot',
    '.jpeg': 'screenshot',
    '.webm': 'video',
    '.zip': 'trace',
    '.md': 'context',
}

if not os.path.exists(JUNIT):
    print(f"JUnit file not found at {JUNIT}. Run tests first to generate it.")
    raise SystemExit(1)

tree = ET.parse(JUNIT)
root = tree.getroot()

timestamp = datetime.now(timezone.utc).isoformat(timespec='seconds')
run_id = timestamp.replace(':', '-')

browsers = {}
failures = []
tests = []
total = passed = failed = skipped = 0
duration = 0.0

for testsuite in root.findall('.//testsuite'):
    browser = testsuite.get('hostname') or testsuite.get('name') or 'unknown'
    b = browsers.setdefault(browser, {'total': 0, 'passed': 0, 'failed': 0, 'skipped': 0})
    for testcase in testsuite.findall('testcase'):
        name = testcase.get('name') or ''
        classname = testcase.get('classname') or ''
        time = float(testcase.get('time') or 0)
        duration += time
        status = 'passed'
        for child in list(testcase):
            tag = child.tag.lower()
            if tag.endswith('failure') or tag.endswith('error'):
                status = 'failed'
            if tag.endswith('skipped'):
                status = 'skipped'

        # Attachments (screenshots/videos/traces) reported as [[ATTACHMENT|path]] in stdout/text
        all_text = ''.join(testcase.itertext())
        raw_paths = []
        for m in re.findall(r"\[\[ATTACHMENT\|([^\]]+)\]\]", all_text):
            if m not in raw_paths:
                raw_paths.append(m)

        copied_attachments = []
        for rel_path in raw_paths:
            src = rel_path
            if src.startswith('file://'):
                src = src[7:]
            if not os.path.isabs(src):
                src = os.path.join(TEST_RESULTS_DIR, rel_path)
            if not os.path.exists(src):
                continue
            dest_rel = os.path.join('reports', 'run-history-artifacts', run_id, rel_path)
            dest_abs = os.path.join(ROOT, dest_rel)
            os.makedirs(os.path.dirname(dest_abs), exist_ok=True)
            shutil.copy2(src, dest_abs)
            ext = os.path.splitext(rel_path)[1].lower()
            copied_attachments.append({
                'type': ATTACHMENT_TYPES.get(ext, 'file'),
                'path': dest_rel.replace(os.sep, '/'),
            })

        total += 1
        b['total'] += 1
        if status == 'passed':
            passed += 1
            b['passed'] += 1
        elif status == 'failed':
            failed += 1
            b['failed'] += 1
            failures.append({'name': name, 'browser': browser})
        else:
            skipped += 1
            b['skipped'] += 1

        tests.append({
            'name': name,
            'classname': classname,
            'browser': browser,
            'status': status,
            'time': time,
            'attachments': copied_attachments,
        })

if total == 0:
    print('No testcases found in junit.xml; nothing to record.')
    raise SystemExit(1)

entry = {
    'run_id': run_id,
    'timestamp': timestamp,
    # Which environment the run targeted, so staging and release runs stay distinguishable
    # in the history and the report's trend.
    'base_url': os.environ.get('TC_BASE_URL', 'https://test.registertovote.london'),
    'total': total,
    'passed': passed,
    'failed': failed,
    'skipped': skipped,
    'duration_seconds': round(duration, 2),
    'browsers': browsers,
    'failures': failures,
    'tests': tests,
}

if os.path.exists(OUT):
    with open(OUT) as f:
        data = json.load(f)
else:
    data = {'runs': []}

data['runs'].append(entry)

# Prune runs (and their copied artifacts) older than RETENTION_DAYS.
cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
kept = []
pruned = 0
for run in data['runs']:
    try:
        ts = datetime.fromisoformat(run.get('timestamp', ''))
    except ValueError:
        kept.append(run)  # unparseable timestamp — keep rather than risk losing data
        continue
    if ts >= cutoff:
        kept.append(run)
        continue
    pruned += 1
    old_run_id = run.get('run_id')
    if old_run_id:
        old_artifacts_dir = os.path.join(ARTIFACTS_ROOT, old_run_id)
        if os.path.isdir(old_artifacts_dir):
            shutil.rmtree(old_artifacts_dir)
data['runs'] = kept

with open(OUT, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')

status_word = 'passed' if failed == 0 else f'{failed} failed'
print(f"Recorded run: {passed}/{total} passed ({status_word}) -> {OUT}")
if any(t['attachments'] for t in tests):
    print(f"  copied artifacts to {os.path.relpath(os.path.join(ARTIFACTS_ROOT, run_id), ROOT)}/")
if pruned:
    print(f"  pruned {pruned} run(s) older than {RETENTION_DAYS} days (and their artifacts)")
