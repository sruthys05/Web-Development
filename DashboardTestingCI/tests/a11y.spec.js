// Scans each configured page with axe-core and fails on serious/critical violations.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');
const config = require('../a11y.config.json');

const RESULTS_DIR = path.join(__dirname, '..', 'a11y-results');
const pages = [
  ...config.pages,
  ...(process.env.A11Y_INCLUDE_BROKEN ? config.brokenPages : []),
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

test.beforeAll(() => {
  fs.rmSync(RESULTS_DIR, { recursive: true, force: true });
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
});

for (const p of pages) {
  test(`a11y: ${p.name} (${p.path})`, async ({ page }) => {
    await page.goto(p.path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).withTags(config.tags).analyze();

    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      description: v.description,
      helpUrl: v.helpUrl,
      tags: v.tags.filter((t) => t.startsWith('wcag') || t === 'best-practice'),
      nodes: v.nodes.map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 240), summary: n.failureSummary })),
    }));

    fs.writeFileSync(
      path.join(RESULTS_DIR, `${slug(p.name)}.json`),
      JSON.stringify({ name: p.name, path: p.path, url: page.url(), passes: results.passes.length, incomplete: results.incomplete.length, violations }, null, 2)
    );

    const blocking = violations.filter((v) => config.failOn.includes(v.impact));
    const message = blocking
      .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} element${v.nodes.length === 1 ? '' : 's'})\n    ${v.helpUrl}\n` +
        v.nodes.slice(0, 3).map((n) => `    - ${n.target}`).join('\n'))
      .join('\n');

    // Non-blocking findings are still reported on the dashboard.
    expect(blocking, `Blocking accessibility violations on ${p.path}:\n${message}`).toEqual([]);
  });
}
