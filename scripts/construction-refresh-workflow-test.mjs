import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const metadata = await (
    await page.request.get('http://localhost:3002/api/construction/revision')
  ).json();
  let update = false,
    fail = false;
  await page.route('**/api/construction/revision', (route) => {
    if (fail) return route.fulfill({ status: 503, body: 'Unavailable' });
    const revision = update ? 'test-new-publication' : metadata.revision;
    update = false;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...metadata, revision }),
    });
  });
  const initialCheck = page.waitForResponse((r) =>
    r.url().includes('/api/construction/revision'),
  );
  await page.goto('http://localhost:3002/construction');
  await initialCheck;
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.getByTestId('alberta-overview').waitFor();
  assert.equal(
    await page
      .getByRole('table', {
        name: 'Alberta source update cadence and freshness',
        exact: true,
      })
      .getByRole('row')
      .count(),
    8,
  );
  update = true;
  const refreshed = page.waitForRequest(
    (r) =>
      new URL(r.url()).pathname === '/construction' &&
      r.headers()['rsc'] === '1',
  );
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await refreshed;
  await page.evaluate(() => new Promise(requestAnimationFrame));
  fail = true;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.getByText(/Update check unavailable/).waitFor();
  assert.ok(
    (await page.getByTestId('alberta-overview').innerText()).includes(
      '$49.01B',
    ),
  );
  fail = false;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page
    .getByText(/This view checks for newly published evidence/)
    .waitFor();
  console.log(
    'Passed: source cadence, new-revision server refresh, failure retention and recovery.',
  );
} finally {
  await browser.close();
}
