#!/usr/bin/env python3
"""
File Jira bugs for test failures from the most recent run in reports/run-history.json —
but only after re-running each failing test on its own to confirm it still fails.
Flaky, non-reproducing failures are skipped, not ticketed.

Usage:
  python3 tools/file_jira_bugs.py

Requires JIRA_API_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY in the environment
(run via `set -a && source .env && set +a` first, or from run-tests.sh which does this).

For each distinct failing test (deduped by name+file across browsers) in the latest run:
  1. Re-run that exact test (same file, same browser, same test name) in isolation.
  2. If it now passes -> flaky, skip, no ticket filed.
  3. If it fails again -> search Jira for an existing open ticket with the same summary;
     if none exists, create one with the error, repro steps, and the failure screenshot
     attached (pulled from reports/run-history-artifacts/).
"""
import json
import os
import re
import glob
import subprocess
import sys
import base64
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
HISTORY = os.path.join(ROOT, 'reports', 'run-history.json')
ARTIFACTS_ROOT = os.path.join(ROOT, 'reports', 'run-history-artifacts')
RECHECK_JUNIT = os.path.join(ROOT, 'test-results', 'recheck-junit.xml')

JIRA_API_URL = os.environ.get('JIRA_API_URL', '').rstrip('/')
JIRA_EMAIL = os.environ.get('JIRA_EMAIL', '')
JIRA_API_TOKEN = os.environ.get('JIRA_API_TOKEN', '')
JIRA_PROJECT_KEY = os.environ.get('JIRA_PROJECT_KEY', '')
TC_PROJECT_ID = os.environ.get('TC_DEFAULT_PROJECT', '18854')

if not all([JIRA_API_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY]):
    print('Missing JIRA_API_URL / JIRA_EMAIL / JIRA_API_TOKEN / JIRA_PROJECT_KEY in environment. Skipping.')
    raise SystemExit(0)


def jira_request(method, path, body=None, raw_body=None, extra_headers=None):
    auth = base64.b64encode(f'{JIRA_EMAIL}:{JIRA_API_TOKEN}'.encode()).decode()
    headers = {'Authorization': f'Basic {auth}', 'Accept': 'application/json'}
    data = None
    if body is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(body).encode()
    elif raw_body is not None:
        data = raw_body
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(f'{JIRA_API_URL}{path}', data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {'raw': raw.decode(errors='replace')}


def summary_for(test_name, browser):
    return f'{test_name} — failing on {browser}'


def find_existing_ticket(summary):
    escaped = summary.replace('\\', '\\\\').replace('"', '\\"')
    jql = f'project = {JIRA_PROJECT_KEY} AND summary ~ "{escaped}" AND resolution = Unresolved'
    status, resp = jira_request('GET', f'/rest/api/3/search/jql?jql={urllib.parse.quote(jql)}&maxResults=5&fields=summary')
    if status != 200:
        return None
    for issue in resp.get('issues', []):
        if issue.get('fields', {}).get('summary') == summary:
            return issue['key']
    return None


def spec_tc_reference(file_path):
    """Returns the tc-<id>-<slug> ref from the spec's header comment, e.g. 'tc-1578303-resources-navigation'."""
    abs_path = os.path.join(ROOT, 'tests', file_path)
    if not os.path.exists(abs_path):
        return None
    with open(abs_path) as f:
        first_line = f.readline()
    m = re.search(r'specs/(tc-\d+[^\s.]*)', first_line)
    return m.group(1) if m else None


def tc_case_id(tc_ref):
    if not tc_ref:
        return None
    m = re.match(r'tc-(\d+)', tc_ref)
    return m.group(1) if m else None


def tc_case_url(tc_id):
    return f'https://testcollab.io/project/{TC_PROJECT_ID}/test_cases/{tc_id}' if tc_id else None


STEP_RE = re.compile(r'^\s*(\d+)\.\s+(.*)$')
EXPECT_RE = re.compile(r'^\s*-\s*expect:\s*(.*)$', re.IGNORECASE)


def load_tc_plan_steps(tc_ref):
    """Parse the local specs/<tc_ref>-plan.md written by playwright-testcollab-planner, if it exists.
    Returns (plan_filename, [(num, step_text, expected_result), ...]) or (None, None)."""
    if not tc_ref:
        return None, None
    matches = glob.glob(os.path.join(ROOT, 'specs', f'{tc_ref}-plan.md')) or \
        glob.glob(os.path.join(ROOT, 'specs', f'{tc_ref}*.md'))
    if not matches:
        return None, None
    plan_path = matches[0]
    with open(plan_path) as f:
        lines = f.read().splitlines()
    steps = []
    i = 0
    while i < len(lines):
        m = STEP_RE.match(lines[i])
        if m:
            num, text = m.group(1), m.group(2).strip()
            expect = ''
            if i + 1 < len(lines):
                em = EXPECT_RE.match(lines[i + 1])
                if em:
                    expect = em.group(1).strip()
                    i += 1
            steps.append((num, text, expect))
        i += 1
    return os.path.basename(plan_path), steps if steps else None


def recheck_test(file_path, browser, test_name):
    """Re-run exactly this test in isolation. Returns True if it still fails.

    Uses its own --output dir, separate from test-results/ — Playwright wipes
    its outputDir at the start of every run, which would otherwise delete the
    main run's junit.xml (and copied artifacts) that generate_report.py and
    this very script still need to read.
    """
    if os.path.exists(RECHECK_JUNIT):
        os.remove(RECHECK_JUNIT)
    escaped_name = re.escape(test_name)
    cmd = [
        'npx', 'playwright', 'test', f'tests/{file_path}',
        f'--project={browser}', '-g', escaped_name,
        f'--reporter=junit', '--output=test-results/.recheck-artifacts',
    ]
    env = dict(os.environ)
    env['PLAYWRIGHT_JUNIT_OUTPUT_NAME'] = RECHECK_JUNIT
    subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, text=True)
    if not os.path.exists(RECHECK_JUNIT):
        print(f'    recheck produced no junit output for {test_name} — treating as still-failing (fail-safe)')
        return True, None
    tree = ET.parse(RECHECK_JUNIT)
    for testcase in tree.getroot().findall('.//testcase'):
        for child in list(testcase):
            if child.tag.lower().endswith(('failure', 'error')):
                msg = child.get('message', '')
                return True, msg
    return False, None


def attach_screenshot(issue_key, screenshot_path):
    abs_path = os.path.join(ROOT, screenshot_path)
    if not os.path.exists(abs_path):
        return
    boundary = '----jirafileupload'
    with open(abs_path, 'rb') as f:
        file_bytes = f.read()
    filename = os.path.basename(abs_path)
    body = (
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f'Content-Type: image/png\r\n\r\n'
    ).encode() + file_bytes + f'\r\n--{boundary}--\r\n'.encode()
    jira_request(
        'POST', f'/rest/api/3/issue/{issue_key}/attachments',
        raw_body=body,
        extra_headers={'X-Atlassian-Token': 'no-check', 'Content-Type': f'multipart/form-data; boundary={boundary}'},
    )


def adf_text(text, bold=False):
    run = {'type': 'text', 'text': text}
    if bold:
        run['marks'] = [{'type': 'strong'}]
    return run


def adf_link(text, href):
    return {'type': 'text', 'text': text, 'marks': [{'type': 'link', 'attrs': {'href': href}}]}


def adf_para(*runs):
    return {'type': 'paragraph', 'content': list(runs)}


def adf_cell(text):
    return {'type': 'tableCell', 'attrs': {}, 'content': [adf_para(adf_text(text))] if text else [{'type': 'paragraph'}]}


def adf_header_cell(text):
    return {'type': 'tableHeader', 'attrs': {}, 'content': [adf_para(adf_text(text, bold=True))]}


def build_description(test_name, file_path, browser, error_message, run_id, timestamp):
    """Matches the existing TestCollab-style Jira template: a 'Test Case Details' heading,
    title/plan paragraphs, and an S.No./Step/Expected Result/Status/Comment table."""
    tc_ref = spec_tc_reference(file_path)
    plan_file, steps = load_tc_plan_steps(tc_ref)
    tc_id = tc_case_id(tc_ref)
    tc_url = tc_case_url(tc_id)
    repro = f'npm test -- tests/{file_path} --project={browser}'
    comment = f'{error_message or "(no error message captured)"}\nBrowser: {browser}\nRun: {run_id} ({timestamp})\nReproduce: {repro}'

    content = [
        {'type': 'heading', 'attrs': {'level': 3}, 'content': [adf_text('Test Case Details')]},
        adf_para(adf_text('Test case title', bold=True), adf_text(f': {test_name} ')),
    ]
    if tc_url:
        content.append(adf_para(adf_text('TestCollab case', bold=True), adf_text(': '), adf_link(f'TC-{tc_id}', tc_url)))

    if steps:
        content.append(adf_para(
            adf_text('Test plan title', bold=True), adf_text(f': {plan_file} '),
            adf_text('Steps', bold=True), adf_text(':'),
        ))
        header = {'type': 'tableRow', 'content': [
            adf_header_cell('S.No.'), adf_header_cell('Step'),
            adf_header_cell('Expected Result'), adf_header_cell('Status'), adf_header_cell('Comment'),
        ]}
        rows = [header]
        for num, text, expect in steps:
            rows.append({'type': 'tableRow', 'content': [
                adf_cell(num), adf_cell(text), adf_cell(expect), adf_cell('Not executed'), adf_cell(''),
            ]})
        rows.append({'type': 'tableRow', 'content': [
            adf_cell('—'), adf_cell('Automated Playwright execution of the above'),
            adf_cell('Test passes without error'), adf_cell('Fail'), adf_cell(comment),
        ]})
        content.append({'type': 'table', 'attrs': {'isNumberColumnEnabled': False, 'layout': 'default'}, 'content': rows})
    else:
        content.append(adf_para(
            adf_text('Note', bold=True),
            adf_text(': no local TestCollab plan file found for this case — step-level detail is unavailable.'),
        ))
        content.append(adf_para(adf_text('Spec file', bold=True), adf_text(f': tests/{file_path}')))
        content.append(adf_para(adf_text('Status', bold=True), adf_text(': Fail')))
        content.append(adf_para(adf_text('Comment', bold=True), adf_text(f': {comment}')))

    return {'type': 'doc', 'version': 1, 'content': content}


def create_ticket(test_name, file_path, browser, error_message, run_id, timestamp, screenshot_path):
    body = {
        'fields': {
            'project': {'key': JIRA_PROJECT_KEY},
            'summary': summary_for(test_name, browser),
            'issuetype': {'name': 'Bug'},
            'labels': ['automated-test-failure', 'playwright'],
            'description': build_description(test_name, file_path, browser, error_message, run_id, timestamp),
        }
    }
    status, resp = jira_request('POST', '/rest/api/3/issue', body=body)
    if status != 201:
        print(f'    FAILED to create ticket: {status} {resp}')
        return None
    key = resp['key']
    if screenshot_path:
        attach_screenshot(key, screenshot_path)
    return key


def main():
    if not os.path.exists(HISTORY):
        print('No reports/run-history.json found; nothing to check.')
        return
    with open(HISTORY) as f:
        data = json.load(f)
    if not data.get('runs'):
        print('No runs recorded.')
        return
    run = data['runs'][-1]
    failed_tests = [t for t in run.get('tests', []) if t.get('status') == 'failed']
    if not failed_tests:
        print('No failing tests in the latest run — nothing to file.')
        return

    print(f'Latest run {run.get("run_id")}: {len(failed_tests)} failing test entr(y/ies) to check.')
    seen = set()
    tickets_by_key = {}  # (name, classname) -> jira browse URL, applied back to every matching test entry
    for t in failed_tests:
        key = (t['name'], t['classname'])
        if key in seen:
            continue
        seen.add(key)

        print(f'  Rechecking "{t["name"]}" [{t["browser"]}] ({t["classname"]})...')
        still_failing, error_message = recheck_test(t['classname'], t['browser'], t['name'])

        if not still_failing:
            print(f'    -> now passes on re-run. Flaky — not filing a ticket.')
            continue

        summary = summary_for(t['name'], t['browser'])
        existing = find_existing_ticket(summary)
        if existing:
            print(f'    -> still failing, but {existing} already open for this. Skipping duplicate.')
            tickets_by_key[key] = f'{JIRA_API_URL}/browse/{existing}'
            continue

        screenshot = next((a['path'] for a in t.get('attachments', []) if a['type'] == 'screenshot'), None)
        ticket_key = create_ticket(
            t['name'], t['classname'], t['browser'], error_message,
            run.get('run_id'), run.get('timestamp'), screenshot,
        )
        if ticket_key:
            print(f'    -> confirmed failing. Filed {JIRA_API_URL}/browse/{ticket_key}')
            tickets_by_key[key] = f'{JIRA_API_URL}/browse/{ticket_key}'

    if tickets_by_key:
        for t in run.get('tests', []):
            url = tickets_by_key.get((t['name'], t['classname']))
            if url:
                t['jira_ticket'] = url
        with open(HISTORY, 'w') as f:
            json.dump(data, f, indent=2)
            f.write('\n')
        print(f'Wrote {len(tickets_by_key)} Jira ticket link(s) back to {os.path.relpath(HISTORY, ROOT)}')


if __name__ == '__main__':
    main()
