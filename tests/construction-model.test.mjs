import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  calculate,
  defaults,
  escalation,
  publicAnnual,
} from '../lib/construction-model.ts';
const project = {
  id: 'test',
  name: 'Test phase',
  region: 'Alberta',
  stage: 'Proposed',
  cost: 100e6,
  start: null,
  end: 2029,
  source: '',
  asOf: '2026-09-05',
};
const selection = { test: { included: true, cost: 100e6, online: 2029 } };
test('reported start is retained when online year is assumed', () => {
  const r = calculate(
    [{ ...project, start: 2027, end: null }],
    selection,
    defaults,
  );
  assert.equal(r.phases[0].startMonth, 2027 * 12);
  assert.match(r.phases[0].basis, /assumed online/);
});
test('export provenance matches model and published inputs', () => {
  const m = JSON.parse(
    readFileSync(
      new URL('../public/data/construction/manifest.json', import.meta.url),
    ),
  );
  for (const [name, hash] of Object.entries(m.sha256)) {
    const path = name.startsWith('lib/')
      ? `../${name}`
      : `../public/data/construction/${name}`;
    assert.equal(
      createHash('sha256')
        .update(readFileSync(new URL(path, import.meta.url)))
        .digest('hex'),
      hash,
    );
  }
});
test('empty DC baseline preserves unknown capacity', () => {
  const r = calculate([project], {}, defaults);
  assert.equal(r.totalHours, 0);
  assert.ok(r.rows.every((x) => x.gap === null && x.ratio === null));
});
test('full-window paid hours conserved and concurrent phases add', () => {
  const r = calculate([project], selection, defaults);
  const expected =
    100e6 *
    0.5 *
    defaults.shares.reduce(
      (s, x, i) => s + (x * defaults.labour[i]) / defaults.wages[i],
      0,
    );
  assert.ok(Math.abs(r.totalHours - expected) < 1e-6);
  const doubled = calculate(
    [project, { ...project, id: 'two' }],
    { ...selection, two: selection.test },
    defaults,
  );
  assert.ok(Math.abs(doubled.totalHours - 2 * r.totalHours) < 1e-6);
});
test('horizon truncation retains tail and total job-years', () => {
  const r = calculate(
    [project],
    { test: { included: true, cost: 100e6, online: 2031 } },
    { ...defaults, years: 3 },
  );
  assert.ok(r.totalHours > 0);
  assert.ok(r.outsideWindowHours > 0);
  assert.ok(
    Math.abs(
      r.totalHours +
        r.outsideWindowHours -
        r.phases[0].hours.reduce((a, b) => a + b, 0),
    ) < 1e-6,
  );
});
test('past proposed starts shift forward without inventing history', () => {
  const r = calculate(
    [project],
    { test: { included: true, cost: 100e6, online: 2026 } },
    defaults,
  );
  assert.equal(r.phases[0].startMonth, 2026 * 12 + 8);
  assert.ok(r.phases[0].basis.includes('shifted'));
});
test('fiscal cash conserved by initialized annual cohorts', () => {
  for (const cohortYears of [4, 5]) {
    const o = { ...defaults, cohortYears };
    const r = calculate([], {}, o);
    for (let y = 2026; y <= 2032; y++) {
      const cash = r.cohorts
        .filter((c) => c.year <= y && c.year > y - cohortYears)
        .reduce((s, c) => s + c.commitment / cohortYears, 0);
      assert.ok(Math.abs(cash - publicAnnual(y, o)) < 0.01);
    }
  }
});
test('zero capacity reports full gap, ample capacity no gap', () => {
  const r = calculate([project], selection, {
    ...defaults,
    capacity: [0, 1e9, null],
  });
  assert.ok(
    r.rows
      .filter((x) => x.trade === 'Civil')
      .every((x) => x.gap === x.dcHours + x.publicHours),
  );
  assert.ok(
    r.rows.filter((x) => x.trade === 'Electrical').every((x) => x.gap === 0),
  );
  assert.ok(
    r.rows.filter((x) => x.trade === 'Mechanical').every((x) => x.gap === null),
  );
});
test('validation rejects invalid shares and missing selected costs', () => {
  assert.throws(() => calculate([], {}, { ...defaults, shares: [1, 1, 1] }));
  assert.throws(() =>
    calculate([project], { test: { ...selection.test, cost: 0 } }, defaults),
  );
  assert.throws(() => calculate([], {}, { ...defaults, wages: [0, 1, 1] }));
});
test('escalation applies only to exposure and elapsed delay', () => {
  assert.equal(escalation(60e6, 0.035, 0), 0);
  assert.equal(escalation(0, 0.035, 6), 0);
  assert.ok(Math.abs(escalation(60e6, 0.035, 6) - 1040969.85) < 0.01);
});
test('platform register equals research source and references resolve', () => {
  const r = JSON.parse(
    readFileSync(
      new URL('../public/data/construction/benchmarks.json', import.meta.url),
    ),
  );
  assert.deepEqual(
    r,
    JSON.parse(
      readFileSync(
        new URL(
          '../docs/research/construction-benchmark-register.json',
          import.meta.url,
        ),
      ),
    ),
  );
  assert.equal(
    new Set(r.parameters.map((p) => p.id)).size,
    r.parameters.length,
  );
  for (const p of r.parameters)
    for (const id of p.source_ids)
      assert.ok(r.sources.some((s) => s.id === id));
});
