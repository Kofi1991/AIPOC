#!/usr/bin/env python3
"""
Generate an improved HTML test report from Playwright JUnit XML and artifacts.

Usage:
  python3 tools/generate_report.py

Output:
  ./test-report.html

Notes:
- Expects test-results/junit.xml to exist (the latest run).
- Also reads specs/run-history.json if present, to render a "Past runs" tab.
- Links in the report point to paths referenced in the JUnit XML (relative to the workspace).
- Uses Chart.js from CDN for charts; an internet connection is required to load the chart library.
"""
import xml.etree.ElementTree as ET
import re
import os
import json
import html

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
JUNIT = os.path.join(ROOT, 'test-results', 'junit.xml')
HISTORY = os.path.join(ROOT, 'specs', 'run-history.json')
OUT = os.path.join(ROOT, 'test-report.html')

if not os.path.exists(JUNIT):
    print(f"JUnit file not found at {JUNIT}. Run tests first to generate test-results/junit.xml")
    raise SystemExit(1)

try:
    tree = ET.parse(JUNIT)
    root = tree.getroot()
except Exception as e:
    print('Failed to parse junit XML:', e)
    raise

# Collect testcases, preserving the testsuite (browser) hostname where available
cases = []
for testsuite in root.findall('.//testsuite'):
    browser = testsuite.get('hostname') or testsuite.get('name') or ''
    for testcase in testsuite.findall('testcase'):
        name = testcase.get('name') or ''
        classname = testcase.get('classname') or ''
        time = testcase.get('time') or ''
        status = 'passed'
        # look for failure/error/skipped children
        for child in list(testcase):
            tag = child.tag.lower()
            if tag.endswith('failure') or tag.endswith('error'):
                status = 'failed'
            if tag.endswith('skipped'):
                status = 'skipped'
        # attachments may appear in system-out text or system-err
        attachments = []
        text_blob = ''
        for child in testcase.findall('system-out') + testcase.findall('system-err'):
            if child.text:
                text_blob += child.text
        # find [[ATTACHMENT|...]] patterns
        for m in re.findall(r"\[\[ATTACHMENT\|([^\]]+)\]\]", text_blob or ''):
            attachments.append(m)
        # Also try scanning all text inside testcase
        all_text = ''.join(testcase.itertext())
        for m in re.findall(r"\[\[ATTACHMENT\|([^\]]+)\]\]", all_text):
            if m not in attachments:
                attachments.append(m)

        cases.append({
            'name': name,
            'classname': classname,
            'time': time,
            'status': status,
            'attachments': attachments,
            'browser': browser,
        })

# If no testcases found, exit
if not cases:
    print('No testcases found in junit.xml')
    raise SystemExit(1)

# Tally counts
counts = {'passed': 0, 'failed': 0, 'skipped': 0}
for c in cases:
    if c['status'] not in counts:
        counts[c['status']] = 0
    counts[c['status']] += 1

# Load past-run history, if any
history_runs = []
if os.path.exists(HISTORY):
    try:
        with open(HISTORY) as f:
            history_runs = json.load(f).get('runs', [])
    except Exception as e:
        print('Warning: failed to read run-history.json:', e)

# Most recent first for the table; chronological for the trend chart
history_runs_desc = list(reversed(history_runs))

# Build HTML
html_parts = []
html_parts.append('<!doctype html>')
html_parts.append('<html lang="en">')
html_parts.append('<head>')
html_parts.append('<meta charset="utf-8">')
html_parts.append('<meta name="viewport" content="width=device-width,initial-scale=1">')
html_parts.append('<title>Test Report</title>')
html_parts.append('<style>')
html_parts.append('body{font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding:20px; background:#f7f7f8;}')
html_parts.append('.summary{display:flex;gap:20px;align-items:center;margin-bottom:20px;flex-wrap:wrap;}')
html_parts.append('.card{background:white;padding:16px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);}')
html_parts.append('table{width:100%;border-collapse:collapse;margin-top:16px;}')
html_parts.append('th,td{padding:8px 10px;border-bottom:1px solid #eee;text-align:left;font-size:13px;}')
html_parts.append('.status-passed{color:green;font-weight:600;}')
html_parts.append('.status-failed{color:#c53030;font-weight:700;}')
html_parts.append('.status-skipped{color:orange;font-weight:600;}')
html_parts.append('.attachments a{margin-right:8px;font-size:12px;}')
html_parts.append('.chart-wrap{width:280px;height:200px;}')
html_parts.append('.chart-wrap-wide{width:100%;height:240px;}')
html_parts.append('.tabs{display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid #e2e2e4;}')
html_parts.append('.tab-btn{padding:10px 18px;border:none;background:none;font-size:14px;font-weight:600;color:#666;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;}')
html_parts.append('.tab-btn.active{color:#2b6cb0;border-bottom-color:#2b6cb0;}')
html_parts.append('.tab-panel{display:none;}')
html_parts.append('.tab-panel.active{display:block;}')
html_parts.append('.pass-rate-bar{display:inline-block;height:8px;background:#2ecc71;border-radius:4px;vertical-align:middle;}')
html_parts.append('.pass-rate-track{display:inline-block;width:80px;height:8px;background:#eee;border-radius:4px;vertical-align:middle;}')
html_parts.append('.muted{color:#888;font-size:13px;}')
html_parts.append('.run-row{cursor:pointer;}')
html_parts.append('.run-row:hover{background:#f7fafc;}')
html_parts.append('.run-detail td{background:#fbfbfc;}')
html_parts.append('</style>')
html_parts.append('</head>')
html_parts.append('<body>')
html_parts.append('<h1>Test Report</h1>')

html_parts.append('<div class="tabs">')
html_parts.append('<button class="tab-btn active" data-tab="latest" onclick="showTab(\'latest\')">Latest run</button>')
html_parts.append(f'<button class="tab-btn" data-tab="history" onclick="showTab(\'history\')">Past runs ({len(history_runs)})</button>')
html_parts.append('</div>')

# ---------------- Latest run tab ----------------
html_parts.append('<div id="tab-latest" class="tab-panel active">')
html_parts.append(f'<p>Source JUnit: <code>{html.escape(os.path.relpath(JUNIT, ROOT))}</code></p>')

# Prepare browser-level aggregation
counts_by_browser = {}
for c in cases:
    b = c.get('browser') or 'unknown'
    if b not in counts_by_browser:
        counts_by_browser[b] = {'passed': 0, 'failed': 0, 'skipped': 0}
    counts_by_browser[b][c['status']] = counts_by_browser[b].get(c['status'], 0) + 1

browsers = sorted(counts_by_browser.keys())

html_parts.append('<div class="summary">')
html_parts.append('<div class="card chart-wrap"><canvas id="resultChart"></canvas></div>')
html_parts.append('<div class="card chart-wrap"><canvas id="browserChart"></canvas></div>')
html_parts.append(f'<div class="card"><h3>Summary</h3><ul><li>Total: {len(cases)}</li><li style="color:green">Passed: {counts.get("passed",0)}</li><li style="color:#c53030">Failed: {counts.get("failed",0)}</li><li style="color:orange">Skipped: {counts.get("skipped",0)}</li></ul></div>')
html_parts.append('</div>')

html_parts.append('<div class="card">')
html_parts.append('<h2>Tests</h2>')
html_parts.append('<table>')
html_parts.append('<thead><tr><th>Test</th><th>Class</th><th>Browser</th><th>Status</th><th>Time (s)</th><th>Artifacts</th></tr></thead>')
html_parts.append('<tbody>')
for c in cases:
    name = html.escape(c['name'])
    classname = html.escape(c['classname'])
    status = c['status']
    time = html.escape(c['time'])
    case_browser = html.escape(c['browser'] or 'unknown')
    status_class = f'status-{status}'
    attachments_html = ''
    if c['attachments']:
        links = []
        for a in c['attachments']:
            p = a
            if p.startswith('file://'):
                p = p[7:]
            if not os.path.isabs(p):
                p_candidate = os.path.join(ROOT, p)
                if os.path.exists(p_candidate):
                    href = os.path.relpath(p_candidate, ROOT)
                else:
                    p2 = os.path.join(ROOT, 'test-results', p)
                    if os.path.exists(p2):
                        href = os.path.relpath(p2, ROOT)
                    else:
                        href = p
            else:
                href = p
            display = html.escape(os.path.basename(href))
            link = f'<a href="{html.escape(href)}" target="_blank">{display}</a>'
            links.append(link)
        attachments_html = '<span class="attachments">' + ' '.join(links) + '</span>'
    html_parts.append(f'<tr><td>{name}</td><td>{classname}</td><td>{case_browser}</td><td class="{status_class}">{status}</td><td>{time}</td><td>{attachments_html}</td></tr>')

html_parts.append('</tbody></table>')
html_parts.append('</div>')
html_parts.append('</div>')  # end tab-latest

# ---------------- Past runs tab ----------------
html_parts.append('<div id="tab-history" class="tab-panel">')
if not history_runs:
    html_parts.append('<div class="card"><p class="muted">No past runs recorded yet. Past runs are appended to <code>specs/run-history.json</code> automatically by <code>npm test</code> / <code>npm run test:report</code>.</p></div>')
else:
    html_parts.append('<div class="summary">')
    html_parts.append('<div class="card chart-wrap-wide" style="flex:1;min-width:400px;"><canvas id="trendChart"></canvas></div>')
    html_parts.append('</div>')
    html_parts.append('<div class="card">')
    html_parts.append('<h2>Past runs</h2>')
    html_parts.append('<p class="muted">Click a row to see every test in that run, with screenshots for failures.</p>')
    html_parts.append('<table>')
    html_parts.append('<thead><tr><th></th><th>When</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Duration (s)</th><th>Pass rate</th><th>Failures</th></tr></thead>')
    html_parts.append('<tbody>')
    for idx, run in enumerate(history_runs_desc):
        run_key = html.escape(str(run.get('run_id') or idx))
        ts = html.escape(str(run.get('timestamp', '')))
        total = run.get('total', 0)
        passed = run.get('passed', 0)
        failed = run.get('failed', 0)
        skipped = run.get('skipped', 0)
        duration = run.get('duration_seconds', 0)
        pass_rate = round((passed / total) * 100) if total else 0
        row_status_class = 'status-passed' if failed == 0 else 'status-failed'
        failure_names = [html.escape(f.get('name', '')) for f in run.get('failures', [])]
        failures_html = '<span class="muted">—</span>'
        if failure_names:
            # de-duplicate (same test can fail across multiple browsers)
            seen = []
            for n in failure_names:
                if n not in seen:
                    seen.append(n)
            failures_html = '<br>'.join(seen)
        bar_width = max(pass_rate, 2)
        html_parts.append(
            f'<tr class="run-row" onclick="toggleRunDetail(\'{run_key}\')">'
            f'<td><span id="run-toggle-{run_key}">▸</span></td>'
            f'<td>{ts}</td><td>{total}</td><td class="status-passed">{passed}</td>'
            f'<td class="{"status-failed" if failed else ""}">{failed}</td><td class="status-skipped">{skipped}</td>'
            f'<td>{duration}</td>'
            f'<td><span class="pass-rate-track"><span class="pass-rate-bar" style="width:{bar_width}%"></span></span> {pass_rate}%</td>'
            f'<td class="{row_status_class}">{failures_html}</td></tr>'
        )

        detail_tests = run.get('tests')
        html_parts.append(f'<tr id="run-detail-{run_key}" class="run-detail" style="display:none;">')
        html_parts.append('<td colspan="9">')
        if not detail_tests:
            html_parts.append('<p class="muted">No per-test detail recorded for this run (it ran before this feature was added).</p>')
        else:
            html_parts.append('<table>')
            html_parts.append('<thead><tr><th>Test</th><th>Browser</th><th>Status</th><th>Time (s)</th><th>Artifacts</th><th>Jira</th></tr></thead>')
            html_parts.append('<tbody>')
            for t in detail_tests:
                t_name = html.escape(t.get('name', ''))
                t_browser = html.escape(t.get('browser', ''))
                t_status = t.get('status', 'passed')
                t_time = t.get('time', '')
                attachments_html = '<span class="muted">—</span>'
                atts = t.get('attachments') or []
                if atts:
                    pieces = []
                    for a in atts:
                        a_path = html.escape(a.get('path', ''))
                        a_type = a.get('type', 'file')
                        display = html.escape(os.path.basename(a.get('path', '')))
                        if a_type == 'screenshot':
                            pieces.append(
                                f'<a href="{a_path}" target="_blank"><img src="{a_path}" alt="{display}" '
                                f'style="max-width:140px;max-height:100px;border-radius:4px;border:1px solid #ddd;vertical-align:middle;margin:2px;" loading="lazy"></a>'
                            )
                        else:
                            pieces.append(f'<a href="{a_path}" target="_blank">{display}</a>')
                    attachments_html = '<span class="attachments">' + ' '.join(pieces) + '</span>'
                jira_url = t.get('jira_ticket')
                if jira_url:
                    jira_key = html.escape(jira_url.rstrip('/').rsplit('/', 1)[-1])
                    jira_html = f'<a href="{html.escape(jira_url)}" target="_blank">{jira_key}</a>'
                else:
                    jira_html = '<span class="muted">—</span>'
                html_parts.append(
                    f'<tr><td>{t_name}</td><td>{t_browser}</td><td class="status-{t_status}">{t_status}</td>'
                    f'<td>{t_time}</td><td>{attachments_html}</td><td>{jira_html}</td></tr>'
                )
            html_parts.append('</tbody></table>')
        html_parts.append('</td></tr>')
    html_parts.append('</tbody></table>')
    html_parts.append('</div>')
html_parts.append('</div>')  # end tab-history

# embed Chart.js and data
html_parts.append('<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>')
chart_data = {
    'labels': ['Passed', 'Failed', 'Skipped'],
    'datasets': [{
        'label': 'Test results',
        'data': [counts.get('passed',0), counts.get('failed',0), counts.get('skipped',0)],
        'backgroundColor': ['#2ecc71', '#e74c3c', '#f39c12']
    }]
}
browser_labels = browsers
passed_by_browser = [counts_by_browser[b].get('passed',0) for b in browser_labels]
failed_by_browser = [counts_by_browser[b].get('failed',0) for b in browser_labels]
skipped_by_browser = [counts_by_browser[b].get('skipped',0) for b in browser_labels]
browser_chart_data = {
    'labels': browser_labels,
    'datasets': [
        {'label': 'Passed', 'data': passed_by_browser, 'backgroundColor': '#2ecc71'},
        {'label': 'Failed', 'data': failed_by_browser, 'backgroundColor': '#e74c3c'},
        {'label': 'Skipped', 'data': skipped_by_browser, 'backgroundColor': '#f39c12'},
    ]
}

# Trend chart: passed/failed count per historical run, oldest to newest
trend_labels = [r.get('timestamp', '')[:16].replace('T', ' ') for r in history_runs]
trend_data = {
    'labels': trend_labels,
    'datasets': [
        {'label': 'Passed', 'data': [r.get('passed', 0) for r in history_runs], 'borderColor': '#2ecc71', 'backgroundColor': '#2ecc71', 'tension': 0.2},
        {'label': 'Failed', 'data': [r.get('failed', 0) for r in history_runs], 'borderColor': '#e74c3c', 'backgroundColor': '#e74c3c', 'tension': 0.2},
    ]
}

html_parts.append('<script>')
html_parts.append('function toggleRunDetail(key) {')
html_parts.append('  var row = document.getElementById("run-detail-" + key);')
html_parts.append('  var toggle = document.getElementById("run-toggle-" + key);')
html_parts.append('  var open = row.style.display !== "none";')
html_parts.append('  row.style.display = open ? "none" : "table-row";')
html_parts.append('  toggle.textContent = open ? "▸" : "▾";')
html_parts.append('}')
html_parts.append('function showTab(tab) {')
html_parts.append('  document.querySelectorAll(".tab-panel").forEach(function(el){ el.classList.remove("active"); });')
html_parts.append('  document.querySelectorAll(".tab-btn").forEach(function(el){ el.classList.remove("active"); });')
html_parts.append('  document.getElementById("tab-" + tab).classList.add("active");')
html_parts.append('  document.querySelector(".tab-btn[data-tab=\'" + tab + "\']").classList.add("active");')
html_parts.append('}')
html_parts.append(f'const data = {json.dumps(chart_data)};')
html_parts.append(f'const browserData = {json.dumps(browser_chart_data)};')
html_parts.append('const ctx = document.getElementById("resultChart").getContext("2d");')
html_parts.append('new Chart(ctx, {type: "doughnut", data: data, options: {plugins:{legend:{position:"bottom"}}}});')
html_parts.append('const bctx = document.getElementById("browserChart").getContext("2d");')
html_parts.append('new Chart(bctx, {type: "bar", data: browserData, options: {plugins:{legend:{position:"bottom"}}, responsive:true, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }});')
if history_runs:
    html_parts.append(f'const trendData = {json.dumps(trend_data)};')
    html_parts.append('const tctx = document.getElementById("trendChart").getContext("2d");')
    html_parts.append('new Chart(tctx, {type: "line", data: trendData, options: {plugins:{legend:{position:"bottom"}}, responsive:true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }});')
html_parts.append('</script>')

html_parts.append('</body>')
html_parts.append('</html>')

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(html_parts))

print(f'Wrote HTML report to {OUT}')
print(f'  latest run: {len(cases)} tests, {len(history_runs)} past runs in history')
print('Open it in your browser, e.g.:')
print(f'  open "{OUT}"')
