#!/usr/bin/env python3
"""
Render the test-automation burndown chart from reports/burndown-data.json.

Usage:
  python3 tools/render_burndown.py

Reads:
  reports/burndown-data.json  { project, definition, history: [{date, total, automated}] }

Writes:
  reports/burndown-chart.html  (self-contained, publish via the Artifact tool)
"""
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_PATH = os.path.join(ROOT, 'reports', 'burndown-data.json')
OUT_PATH = os.path.join(ROOT, 'reports', 'burndown-chart.html')

with open(DATA_PATH) as f:
    data = json.load(f)

history = sorted(data['history'], key=lambda e: e['date'])
project = data['project']
definition = data['definition']

for e in history:
    e['remaining'] = e['total'] - e['automated']

latest = history[-1]
prev = history[-2] if len(history) > 1 else None
total = latest['total']
automated = latest['automated']
remaining = latest['remaining']
pct = round((automated / total) * 100) if total else 0

delta_html = ''
if prev:
    delta = automated - prev['automated']
    if delta > 0:
        delta_html = f'<span class="stat-delta stat-delta--up">+{delta} since {prev["date"]}</span>'
    elif delta < 0:
        delta_html = f'<span class="stat-delta stat-delta--down">{delta} since {prev["date"]}</span>'
    else:
        delta_html = f'<span class="stat-delta">no change since {prev["date"]}</span>'

# --- Chart geometry (logical coordinate space, scaled responsively via viewBox) ---
CHART_W = 960
CHART_H = 360
PAD_L = 48
PAD_R = 24
PAD_T = 24
PAD_B = 40
plot_w = CHART_W - PAD_L - PAD_R
plot_h = CHART_H - PAD_T - PAD_B

n = len(history)
y_max = max(total for e in history)
y_max = max(y_max, 10)
# round y_max up to a friendly multiple of 10
y_max = ((y_max // 10) + 1) * 10 if y_max % 10 else y_max + 10


def x_at(i):
    if n == 1:
        return PAD_L + plot_w / 2
    return PAD_L + (plot_w * i / (n - 1))


def y_at(value):
    return PAD_T + plot_h - (plot_h * value / y_max)


def path_for(key, dot_radius=4):
    pts = [(x_at(i), y_at(e[key])) for i, e in enumerate(history)]
    if len(pts) == 1:
        x, y = pts[0]
        return '', [(x, y)]
    d = f'M {pts[0][0]:.1f} {pts[0][1]:.1f} ' + ' '.join(f'L {x:.1f} {y:.1f}' for x, y in pts[1:])
    return d, pts


automated_path, automated_pts = path_for('automated')
remaining_path, remaining_pts = path_for('remaining')
total_path, total_pts = path_for('total')

# Area fill under the automated line, anchored to baseline (y = y_at(0))
baseline_y = y_at(0)
if len(automated_pts) == 1:
    area_path = ''
else:
    area_path = (
        f'M {automated_pts[0][0]:.1f} {baseline_y:.1f} '
        + ' '.join(f'L {x:.1f} {y:.1f}' for x, y in automated_pts)
        + f' L {automated_pts[-1][0]:.1f} {baseline_y:.1f} Z'
    )

# Y axis gridlines/ticks (5 steps)
y_ticks = []
for step in range(0, 6):
    val = round(y_max * step / 5)
    y_ticks.append((val, y_at(val)))

# X axis labels: show every point if <=8, else thin out
label_every = 1 if n <= 8 else max(1, n // 8)
x_labels = [(x_at(i), e['date']) for i, e in enumerate(history) if i % label_every == 0 or i == n - 1]

points_json = json.dumps(history)

dots_svg = []
for i, e in enumerate(history):
    ax, ay = x_at(i), y_at(e['automated'])
    rx, ry = x_at(i), y_at(e['remaining'])
    dots_svg.append(
        f'<circle class="dot dot--automated" data-i="{i}" cx="{ax:.1f}" cy="{ay:.1f}" r="4"></circle>'
    )
    dots_svg.append(
        f'<circle class="dot dot--remaining" data-i="{i}" cx="{rx:.1f}" cy="{ry:.1f}" r="4"></circle>'
    )

gridlines_svg = '\n'.join(
    f'<line class="grid" x1="{PAD_L}" y1="{y:.1f}" x2="{CHART_W - PAD_R}" y2="{y:.1f}"></line>'
    for val, y in y_ticks
)
y_tick_labels_svg = '\n'.join(
    f'<text class="tick tick--y" x="{PAD_L - 10}" y="{y:.1f}" text-anchor="end" dominant-baseline="middle">{val}</text>'
    for val, y in y_ticks
)
x_tick_labels_svg = '\n'.join(
    f'<text class="tick tick--x" x="{x:.1f}" y="{CHART_H - PAD_B + 20}" text-anchor="middle">{date}</text>'
    for x, date in x_labels
)

table_rows = '\n'.join(
    f'<tr><td>{e["date"]}</td><td class="num">{e["total"]}</td>'
    f'<td class="num">{e["automated"]}</td><td class="num">{e["remaining"]}</td></tr>'
    for e in history
)

html = f"""<title>Automation Burndown</title>
<style>
  .bd-root {{
    color-scheme: light;
    --page:        #f9f9f7;
    --surface:     #fcfcfb;
    --ink:         #0b0b0b;
    --ink-2:       #52514e;
    --muted:       #898781;
    --grid:        #e1e0d9;
    --baseline:    #c3c2b7;
    --border:      rgba(11,11,11,0.10);
    --automated:   #2a78d6;
    --automated-fill: rgba(42,120,214,0.12);
    --remaining:   #eb6834;
    --good:        #006300;
  }}
  @media (prefers-color-scheme: dark) {{
    :root:not([data-theme="light"]) .bd-root {{
      color-scheme: dark;
      --page:        #0d0d0d;
      --surface:     #1a1a19;
      --ink:         #ffffff;
      --ink-2:       #c3c2b7;
      --muted:       #898781;
      --grid:        #2c2c2a;
      --baseline:    #383835;
      --border:      rgba(255,255,255,0.10);
      --automated:   #3987e5;
      --automated-fill: rgba(57,135,229,0.16);
      --remaining:   #d95926;
      --good:        #0ca30c;
    }}
  }}
  :root[data-theme="dark"] .bd-root {{
    color-scheme: dark;
    --page:        #0d0d0d;
    --surface:     #1a1a19;
    --ink:         #ffffff;
    --ink-2:       #c3c2b7;
    --muted:       #898781;
    --grid:        #2c2c2a;
    --baseline:    #383835;
    --border:      rgba(255,255,255,0.10);
    --automated:   #3987e5;
    --automated-fill: rgba(57,135,229,0.16);
    --remaining:   #d95926;
    --good:        #0ca30c;
  }}

  .bd-root {{
    background: var(--page);
    color: var(--ink);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    padding: 32px 20px 64px;
    box-sizing: border-box;
    min-height: 100%;
  }}
  .bd-root * {{ box-sizing: border-box; }}
  .bd-wrap {{ max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }}

  .bd-header {{ display: flex; flex-direction: column; gap: 4px; }}
  .bd-eyebrow {{
    font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--muted);
  }}
  .bd-title {{ font-size: 26px; font-weight: 700; margin: 0; letter-spacing: -0.01em; text-wrap: balance; }}
  .bd-sub {{ font-size: 14px; color: var(--ink-2); margin: 0; }}

  .bd-stats {{ display: flex; gap: 16px; flex-wrap: wrap; }}
  .stat-tile {{
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 16px 20px; flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: 4px;
  }}
  .stat-label {{ font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }}
  .stat-value {{ font-size: 32px; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.1; }}
  .stat-value small {{ font-size: 16px; font-weight: 500; color: var(--ink-2); }}
  .stat-delta {{ font-size: 12px; color: var(--ink-2); font-variant-numeric: tabular-nums; }}
  .stat-delta--up {{ color: var(--good); }}

  .bd-card {{
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px;
  }}
  .bd-card-head {{ display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }}
  .bd-card-title {{ font-size: 15px; font-weight: 600; margin: 0; }}

  .legend {{ display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--ink-2); }}
  .legend-item {{ display: flex; align-items: center; gap: 6px; }}
  .legend-swatch {{ width: 10px; height: 10px; border-radius: 2px; flex: none; }}
  .legend-swatch--automated {{ background: var(--automated); }}
  .legend-swatch--remaining {{ background: var(--remaining); }}
  .legend-swatch--total {{ background: none; border-top: 2px dashed var(--baseline); height: 0; align-self: center; }}

  .chart-scroll {{ overflow-x: auto; }}
  svg.chart {{ width: 100%; height: auto; display: block; min-width: 480px; }}
  .grid {{ stroke: var(--grid); stroke-width: 1; }}
  .tick {{ fill: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }}
  .line {{ fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }}
  .line--automated {{ stroke: var(--automated); }}
  .line--remaining {{ stroke: var(--remaining); }}
  .line--total {{ stroke: var(--baseline); stroke-width: 1.5; stroke-dasharray: 4 4; }}
  .area--automated {{ fill: var(--automated-fill); }}
  .dot {{ fill: var(--surface); stroke-width: 2; }}
  .dot--automated {{ stroke: var(--automated); }}
  .dot--remaining {{ stroke: var(--remaining); }}
  .dot-hit {{ fill: transparent; cursor: pointer; }}

  .crosshair {{ stroke: var(--baseline); stroke-width: 1; display: none; pointer-events: none; }}
  .tooltip {{
    position: absolute; pointer-events: none; display: none;
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 10px; font-size: 12px; color: var(--ink); box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    white-space: nowrap; z-index: 2;
  }}
  .tooltip .tt-date {{ font-weight: 600; margin-bottom: 4px; }}
  .tooltip .tt-row {{ display: flex; justify-content: space-between; gap: 12px; color: var(--ink-2); }}
  .tooltip .tt-row span:last-child {{ font-variant-numeric: tabular-nums; color: var(--ink); }}
  .chart-holder {{ position: relative; }}

  table.bd-table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  table.bd-table th, table.bd-table td {{ text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); }}
  table.bd-table th {{ color: var(--muted); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }}
  table.bd-table td.num, table.bd-table th.num {{ text-align: right; font-variant-numeric: tabular-nums; }}
  details.bd-table-toggle summary {{ cursor: pointer; font-size: 13px; color: var(--ink-2); font-weight: 600; }}
  details.bd-table-toggle {{ margin-top: 4px; }}
</style>

<div class="bd-root">
  <div class="bd-wrap">
    <div class="bd-header">
      <div class="bd-eyebrow">{project}</div>
      <h1 class="bd-title">Test automation burndown</h1>
      <p class="bd-sub">{definition}. Updated daily.</p>
    </div>

    <div class="bd-stats">
      <div class="stat-tile">
        <div class="stat-label">Automated</div>
        <div class="stat-value">{automated} <small>/ {total}</small></div>
        {delta_html}
      </div>
      <div class="stat-tile">
        <div class="stat-label">Remaining</div>
        <div class="stat-value">{remaining}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-label">Complete</div>
        <div class="stat-value">{pct}<small>%</small></div>
      </div>
    </div>

    <div class="bd-card">
      <div class="bd-card-head">
        <h2 class="bd-card-title">Cases automated vs. remaining over time</h2>
        <div class="legend">
          <span class="legend-item"><span class="legend-swatch legend-swatch--automated"></span>Automated</span>
          <span class="legend-item"><span class="legend-swatch legend-swatch--remaining"></span>Remaining</span>
          <span class="legend-item"><span class="legend-swatch legend-swatch--total"></span>Total scope</span>
        </div>
      </div>
      <div class="chart-holder">
        <div class="chart-scroll">
          <svg class="chart" viewBox="0 0 {CHART_W} {CHART_H}" role="img" aria-label="Burndown chart of automated versus remaining test cases over time">
            {gridlines_svg}
            <line class="grid" x1="{PAD_L}" y1="{CHART_H - PAD_B}" x2="{CHART_W - PAD_R}" y2="{CHART_H - PAD_B}" style="stroke:var(--baseline)"></line>
            {f'<path class="line line--total" d="{total_path}"></path>' if total_path else ''}
            {f'<path class="area--automated" d="{area_path}"></path>' if area_path else ''}
            {f'<path class="line line--automated" d="{automated_path}"></path>' if automated_path else ''}
            {f'<path class="line line--remaining" d="{remaining_path}"></path>' if remaining_path else ''}
            {chr(10).join(dots_svg)}
            {y_tick_labels_svg}
            {x_tick_labels_svg}
            <line class="crosshair" id="crosshair" x1="0" y1="{PAD_T}" x2="0" y2="{CHART_H - PAD_B}"></line>
          </svg>
        </div>
        <div class="tooltip" id="tooltip"></div>
      </div>

      <details class="bd-table-toggle">
        <summary>Show data table</summary>
        <table class="bd-table">
          <thead><tr><th>Date</th><th class="num">Total</th><th class="num">Automated</th><th class="num">Remaining</th></tr></thead>
          <tbody>
            {table_rows}
          </tbody>
        </table>
      </details>
    </div>
  </div>
</div>

<script>
(function () {{
  var history = {points_json};
  var svg = document.querySelector('svg.chart');
  var tooltip = document.getElementById('tooltip');
  var crosshair = document.getElementById('crosshair');
  var holder = document.querySelector('.chart-holder');
  if (!svg || history.length === 0) return;

  var dots = Array.prototype.slice.call(svg.querySelectorAll('.dot--automated'));

  function showFor(i) {{
    var e = history[i];
    var dot = dots[i];
    if (!dot) return;
    var cx = parseFloat(dot.getAttribute('cx'));
    crosshair.setAttribute('x1', cx);
    crosshair.setAttribute('x2', cx);
    crosshair.style.display = 'block';

    tooltip.innerHTML =
      '<div class="tt-date">' + e.date + '</div>' +
      '<div class="tt-row"><span>Automated</span><span>' + e.automated + '</span></div>' +
      '<div class="tt-row"><span>Remaining</span><span>' + e.remaining + '</span></div>' +
      '<div class="tt-row"><span>Total</span><span>' + e.total + '</span></div>';
    tooltip.style.display = 'block';

    var svgRect = svg.getBoundingClientRect();
    var holderRect = holder.getBoundingClientRect();
    var scale = svgRect.width / {CHART_W};
    var left = (cx * scale) + (svgRect.left - holderRect.left);
    tooltip.style.left = Math.min(left + 12, holderRect.width - tooltip.offsetWidth - 8) + 'px';
    tooltip.style.top = '8px';
  }}

  function hide() {{
    tooltip.style.display = 'none';
    crosshair.style.display = 'none';
  }}

  dots.forEach(function (dot, i) {{
    var hit = dot.cloneNode();
    hit.setAttribute('r', 12);
    hit.classList.add('dot-hit');
    hit.addEventListener('mouseenter', function () {{ showFor(i); }});
    svg.appendChild(hit);
  }});

  svg.addEventListener('mouseleave', hide);
}})();
</script>
"""

with open(OUT_PATH, 'w') as f:
    f.write(html)

print(f"Wrote {OUT_PATH}")
print(f"Latest: {latest['date']} — automated {automated}/{total} ({pct}%)")
