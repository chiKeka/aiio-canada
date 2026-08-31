import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright-core';

const baseUrl = process.env.AIIO_BASE_URL ?? 'http://127.0.0.1:3002';
const executablePath = process.env.CHROME_EXECUTABLE ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const routes = ['/', '/evidence', '/pressure', '/scenario', '/methods', '/digest', '/downloads'];
const blockingImpacts = new Set(['serious', 'critical']);

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
const report = [];

try {
  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    report.push({
      route,
      violations: results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
        help: violation.help,
        examples: violation.nodes.slice(0, 12).map((node) => ({
          target: node.target,
          html: node.html,
          summary: node.failureSummary,
        })),
      })),
    });
  }
} finally {
  await context.close();
  await browser.close();
}

const blockers = report.flatMap(({ route, violations }) =>
  violations.filter(({ impact }) => blockingImpacts.has(impact)).map((violation) => ({ route, ...violation })),
);

console.log(JSON.stringify({ baseUrl, routes: report, blockingViolations: blockers }, null, 2));
if (blockers.length > 0) process.exitCode = 1;
