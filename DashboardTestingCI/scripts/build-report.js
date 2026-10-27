#!/usr/bin/env node
// Builds report/index.html (dashboard) + report/history.json from a11y-results/*.json.
// History is read from HISTORY_FILE (default: reports/history.json) and appended to.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, 'a11y-results');
const OUT_DIR = path.join(ROOT, 'report');
const HISTORY_IN = process.env.HISTORY_FILE || path.join(ROOT, 'reports', 'history.json');
const MAX_RUNS = 100;
const IMPACTS = ['critical', 'serious', 'moderate', 'minor'];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function loadResults() {
  if (!fs.existsSync(RESULTS_DIR)) { console.error('No a11y-results/ found. Run the tests first.'); process.exit(1); }
  return fs.readdirSync(RESULTS_DIR).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf8')))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function countByImpact(violations) {
  const c = Object.fromEntries(IMPACTS.map((i) => [i, 0]));
  for (const v of violations) c[v.impact] = (c[v.impact] || 0) + v.nodes.length;
  return c;
}

function loadHistory() {
  try { const h = JSON.parse(fs.readFileSync(HISTORY_IN, 'utf8')); return Array.isArray(h) ? h : []; } catch { return []; }
}

const pages = loadResults();
const all = pages.flatMap((p) => p.violations);
const entry = {
  timestamp: new Date().toISOString(),
  sha: (process.env.GITHUB_SHA || 'local').slice(0, 7),
  ref: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'local',
  runId: process.env.GITHUB_RUN_ID || String(Date.now()),
  totals: countByImpact(all),
  pages: pages.map((p) => ({ name: p.name, path: p.path, ...countByImpact(p.violations) })),
};

let history = loadHistory().filter((h) => h.runId !== entry.runId);
history.push(entry);
history = history.slice(-MAX_RUNS);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'history.json'), JSON.stringify(history, null, 2));
fs.mkdirSync(path.dirname(HISTORY_IN), { recursive: true });
fs.writeFileSync(HISTORY_IN, JSON.stringify(history, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'summary.md'), summaryMarkdown());

function total(t) { return IMPACTS.reduce((n, i) => n + (t[i] || 0), 0); }

function summaryMarkdown() {
  const blocking = entry.totals.critical + entry.totals.serious;
  const prev = history.length > 1 ? history[history.length - 2] : null;
  const delta = prev ? total(entry.totals) - total(prev.totals) : null;
  let md = `### ${blocking ? '❌' : '✅'} Accessibility scan: ${blocking} blocking violation${blocking === 1 ? '' : 's'}\n\n`;
  md += `| Page | Critical | Serious | Moderate | Minor |\n|---|---:|---:|---:|---:|\n`;
  for (const p of entry.pages) md += `| ${p.name} | ${p.critical} | ${p.serious} | ${p.moderate} | ${p.minor} |\n`;
  md += `| **Total** | **${entry.totals.critical}** | **${entry.totals.serious}** | **${entry.totals.moderate}** | **${entry.totals.minor}** |\n`;
  if (delta !== null) md += `\nChange since previous recorded run: ${delta > 0 ? '+' : ''}${delta} affected elements.\n`;
  md += `\n_Automated checks cover only a portion of WCAG. See the README for what still needs manual testing._\n`;
  return md;
}

// ---------- Dashboard ----------
const COLORS = { critical: '#a3201a', serious: '#c2570c', moderate: '#8a6a00', minor: '#2f6f8f' };

function chart() {
  const W = 760, H = 260, L = 44, R = 16, T = 16, B = 40;
  const n = history.length;
  const max = Math.max(1, ...history.flatMap((h) => IMPACTS.map((i) => h.totals[i] || 0)));
  const x = (i) => L + (n === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1));
  const y = (v) => T + (H - T - B) * (1 - v / max);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="ct ct-d" class="chart"><title id="ct">Violations over time</title><desc id="ct-d">Line chart of affected elements per impact level across ${n} recorded runs. The data table below has the same numbers.</desc>`;
  for (let g = 0; g <= 4; g++) {
    const v = Math.round((max * g) / 4), gy = y(v);
    svg += `<line x1="${L}" x2="${W - R}" y1="${gy}" y2="${gy}" class="grid"/><text x="${L - 8}" y="${gy + 4}" text-anchor="end" class="axis">${v}</text>`;
  }
  const step = Math.max(1, Math.ceil(n / 8));
  history.forEach((h, i) => {
    if (i % step === 0 || i === n - 1) svg += `<text x="${x(i)}" y="${H - 18}" text-anchor="middle" class="axis">${esc(h.sha)}</text>`;
  });
  const dash = { critical: '', serious: '8 4', moderate: '2 4', minor: '10 3 2 3' };
  for (const imp of IMPACTS) {
    const pts = history.map((h, i) => `${x(i)},${y(h.totals[imp] || 0)}`).join(' ');
    svg += `<polyline points="${pts}" fill="none" stroke="${COLORS[imp]}" stroke-width="2.5" stroke-dasharray="${dash[imp]}"/>`;
    history.forEach((h, i) => { svg += `<circle cx="${x(i)}" cy="${y(h.totals[imp] || 0)}" r="3.5" fill="${COLORS[imp]}"/>`; });
  }
  return svg + '</svg>';
}

function legend() {
  return `<ul class="legend">${IMPACTS.map((i) => `<li><svg width="34" height="10" aria-hidden="true"><line x1="0" x2="34" y1="5" y2="5" stroke="${COLORS[i]}" stroke-width="3" stroke-dasharray="${{ critical: '', serious: '8 4', moderate: '2 4', minor: '10 3 2 3' }[i]}"/></svg>${i}</li>`).join('')}</ul>`;
}

function historyTable() {
  const rows = [...history].reverse().slice(0, 15).map((h) =>
    `<tr><td>${esc(new Date(h.timestamp).toISOString().slice(0, 16).replace('T', ' '))}</td><td><code>${esc(h.sha)}</code></td><td>${esc(h.ref)}</td>${IMPACTS.map((i) => `<td class="num">${h.totals[i] || 0}</td>`).join('')}</tr>`).join('');
  return `<table><caption class="sr">Recorded runs, newest first</caption><thead><tr><th scope="col">When (UTC)</th><th scope="col">Commit</th><th scope="col">Branch</th>${IMPACTS.map((i) => `<th scope="col" class="num">${i}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function pageTable() {
  const rows = entry.pages.map((p) =>
    `<tr><th scope="row">${esc(p.name)} <code>${esc(p.path)}</code></th>${IMPACTS.map((i) => `<td class="num ${p[i] && (i === 'critical' || i === 'serious') ? 'bad' : ''}">${p[i]}</td>`).join('')}</tr>`).join('');
  return `<table><caption class="sr">Latest run by page</caption><thead><tr><th scope="col">Page</th>${IMPACTS.map((i) => `<th scope="col" class="num">${i}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

function details() {
  const items = pages.flatMap((p) => p.violations.map((v) => ({ ...v, page: p })))
    .sort((a, b) => IMPACTS.indexOf(a.impact) - IMPACTS.indexOf(b.impact));
  if (!items.length) return '<p class="ok">No automated violations in the latest run.</p>';
  return items.map((v) => `<details><summary><span class="pill ${v.impact}">${esc(v.impact)}</span> ${esc(v.help)} <span class="where">${esc(v.page.name)}, ${v.nodes.length} element${v.nodes.length === 1 ? '' : 's'}</span></summary>
    <p><code>${esc(v.id)}</code> · <a href="${esc(v.helpUrl)}">How to fix</a> · ${esc(v.tags.join(', '))}</p>
    <ul>${v.nodes.slice(0, 5).map((n) => `<li><code>${esc(n.target)}</code><pre>${esc(n.html)}</pre></li>`).join('')}</ul></details>`).join('');
}

const blocking = entry.totals.critical + entry.totals.serious;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility dashboard</title>
<style>
:root{--bg:#eef2f5;--panel:#fff;--ink:#14202b;--muted:#46535f;--line:#cbd5dd;--ok:#1f6b3a;--bad:#a3201a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,sans-serif}
main{max-width:56rem;margin:0 auto;padding:2rem 1.25rem 4rem}
h1{font:700 2rem/1.15 Georgia,'Times New Roman',serif;margin:0 0 .25rem}
h2{font:700 1.2rem Georgia,serif;margin:2.5rem 0 .75rem}
.meta{color:var(--muted);margin:0 0 1.5rem}
.status{padding:1rem 1.25rem;border-left:6px solid var(--ok);background:var(--panel);font-size:1.1rem}
.status.fail{border-color:var(--bad)}
.panel{background:var(--panel);border:1px solid var(--line);padding:1rem;overflow-x:auto}
.chart{width:100%;height:auto}.grid{stroke:var(--line)}.axis{font-size:11px;fill:var(--muted)}
.legend{display:flex;gap:1.25rem;flex-wrap:wrap;list-style:none;padding:0;margin:.5rem 0 0}.legend li{display:flex;gap:.4rem;align-items:center}
table{width:100%;border-collapse:collapse;background:var(--panel)}th,td{padding:.5rem .75rem;border-bottom:1px solid var(--line);text-align:left}
.num{text-align:right;font-variant-numeric:tabular-nums}.bad{color:var(--bad);font-weight:700}
.sr{position:absolute;left:-9999px}
details{background:var(--panel);border:1px solid var(--line);margin-bottom:.5rem;padding:.6rem .9rem}summary{cursor:pointer}
summary:focus-visible,a:focus-visible{outline:3px solid #1a5fb4;outline-offset:2px}
.pill{display:inline-block;padding:0 .5rem;border-radius:3px;color:#fff;font-size:.85rem;margin-right:.4rem}
.pill.critical{background:${COLORS.critical}}.pill.serious{background:${COLORS.serious}}.pill.moderate{background:#6f5600}.pill.minor{background:${COLORS.minor}}
.where{color:var(--muted);font-size:.9rem}pre{white-space:pre-wrap;word-break:break-all;background:#f3f5f7;padding:.4rem;margin:.25rem 0 .75rem;font-size:.85rem}
.ok{color:var(--ok);font-weight:600}a{color:#0b4f9c}
.note{color:var(--muted);max-width:42rem}
</style></head><body><main>
<h1>Accessibility dashboard</h1>
<p class="meta">Latest run ${esc(entry.timestamp.slice(0, 16).replace('T', ' '))} UTC · commit <code>${esc(entry.sha)}</code> · ${esc(entry.ref)}</p>
<p class="status ${blocking ? 'fail' : ''}" role="status">${blocking ? `Build fails: ${blocking} critical or serious violation${blocking === 1 ? '' : 's'}.` : 'Build passes: no critical or serious violations.'} ${total(entry.totals) - blocking} lower-impact issue${total(entry.totals) - blocking === 1 ? '' : 's'} recorded.</p>
<h2>Violations over time</h2>
<div class="panel">${chart()}${legend()}</div>
<h2>Recorded runs</h2>${historyTable()}
<h2>Latest run by page</h2>${pageTable()}
<h2>Violation details</h2>${details()}
<h2>What this does not cover</h2>
<p class="note">Automated scans typically find only a fraction of real-world accessibility barriers. Keyboard flow, screen reader output, meaningful alt text, focus management and cognitive load still need manual testing. See the README.</p>
</main></body></html>`;

fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
console.log(`Dashboard written to report/index.html (${history.length} run${history.length === 1 ? '' : 's'} of history). Blocking violations: ${blocking}`);
