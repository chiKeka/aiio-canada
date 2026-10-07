import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
function isolated(source) {
  const child = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import assert from 'node:assert/strict';\n${source}`,
    ],
    { cwd: process.cwd(), encoding: 'utf8', timeout: 10000 },
  );
  assert.equal(child.error, undefined);
  assert.equal(child.status, 0, child.stderr);
}
function resolvedVersion(parent, dependency) {
  let parentEntry;
  try {
    parentEntry = require.resolve(`${parent}/package.json`);
  } catch {
    parentEntry = require.resolve(parent);
  }
  const consumer = createRequire(parentEntry);
  const entry =
    dependency === '@modelcontextprotocol/sdk'
      ? `${dependency}/server/index.js`
      : dependency;
  let directory = dirname(consumer.resolve(entry));
  while (directory !== dirname(directory)) {
    const manifest = join(directory, 'package.json');
    if (existsSync(manifest)) {
      const json = JSON.parse(readFileSync(manifest, 'utf8'));
      if (json.name === dependency) return json.version;
    }
    directory = dirname(directory);
  }
  throw new Error(`No resolved package identity for ${dependency}`);
}
void test('each actual dependency consumer resolves the official same-major patched release', () => {
  for (const [parent, dependency, version] of [
    ['shadcn', '@modelcontextprotocol/sdk', '1.31.0'],
    ['shadcn', 'postcss-selector-parser', '7.1.6'],
    ['express', 'proxy-addr', '2.0.8'],
    ['next', 'sharp', '0.35.5'],
    ['miniflare', 'sharp', '0.35.5'],
    ['@tailwindcss/node', 'source-map-js', '1.2.2'],
    ['postcss', 'source-map-js', '1.2.2'],
    ['oxfmt', 'tinypool', '2.1.2'],
  ])
    assert.equal(
      resolvedVersion(parent, dependency),
      version,
      `${parent} -> ${dependency}`,
    );
});
void test('proxy subnet handling rejects spoofable mapped prefixes and preserves valid IPv4 trust', () => {
  isolated(`import proxyaddr from 'proxy-addr';
  assert.equal(proxyaddr.compile('::ffff:10.0.0.0/8')('203.0.113.4'), false);
  const trusted = proxyaddr.compile('10.0.0.0/8');
  assert.equal(trusted('10.1.2.3'), true);
  assert.equal(trusted('203.0.113.4'), false);`);
});
void test('indexed source maps reject excessive offsets and preserve ordinary mapping', () => {
  isolated(`import { SourceMapConsumer } from 'source-map-js';
  const map = {version: 3, sources: ['fixture.js'], names: [], mappings: 'AAAA'};
  assert.throws(() => new SourceMapConsumer({version: 3, sections: [{offset: {line: Number.MAX_SAFE_INTEGER, column: 0}, map}]}), /offset line/);
  const consumer = new SourceMapConsumer({version: 3, sections: [{offset: {line: 2, column: 0}, map}]});
  assert.equal(consumer.originalPositionFor({line: 3, column: 1}).source, 'fixture.js');`);
});
void test(
  'long flat selectors preserve parsing without the quadratic input path',
  { timeout: 5000 },
  () => {
    isolated(`import selectorParser from 'postcss-selector-parser';
  const selector = '.a'.repeat(10000);
  const ast = selectorParser().astSync(selector);
  assert.equal(ast.toString(), selector);
  assert.equal(ast.first.nodes.length, 10000);`);
  },
);
void test('OAuth tokens retain issuer provenance instead of discarding the binding', () => {
  const child = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import { OAuthTokensSchema } from '@modelcontextprotocol/sdk/shared/auth.js';
    console.log(JSON.stringify(OAuthTokensSchema.parse({access_token: 'synthetic-fixture', token_type: 'Bearer', issuer: 'https://issuer.example.test'})));
  `,
    ],
    { cwd: process.cwd(), encoding: 'utf8', timeout: 10000 },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.equal(JSON.parse(child.stdout).issuer, 'https://issuer.example.test');
});
void test('sharp uses patched librsvg and still renders an ordinary local SVG', () => {
  isolated(`import sharp from 'sharp';
  assert.equal(sharp.versions.sharp, '0.35.5');
  assert.equal(sharp.versions.rsvg, '2.63.2');
  const result = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="red"/></svg>')).png().toBuffer({resolveWithObject: true});
  assert.equal(result.info.width, 2);
  assert.equal(result.info.height, 2);
  assert.equal(result.info.format, 'png');`);
});
void test('tinypool ignores inherited worker environment and run filename in an isolated process', () => {
  const worker = fileURLToPath(
    new URL('./fixtures/security/tinypool-worker.mjs', import.meta.url),
  );
  const alternate = fileURLToPath(
    new URL('./fixtures/security/tinypool-alternate.mjs', import.meta.url),
  );
  const script = `
    import Tinypool from 'tinypool';
    Object.prototype.env = {AIIO_SECURITY_FIXTURE_INJECTED: 'unexpected'};
    Object.prototype.filename = ${JSON.stringify(alternate)};
    const pool = new Tinypool({filename: ${JSON.stringify(worker)}, minThreads: 1, maxThreads: 1, execArgv: []});
    try { console.log(JSON.stringify(await pool.run(42, {}))); }
    finally { delete Object.prototype.env; delete Object.prototype.filename; await pool.destroy(); }
  `;
  const child = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', script],
    { cwd: process.cwd(), encoding: 'utf8', timeout: 10000 },
  );
  assert.equal(child.error, undefined);
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout.trim()), {
    value: 42,
    injected: null,
  });
});
