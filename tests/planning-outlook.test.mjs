import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
function load(path) {
  const source = readFileSync(resolve(root, path), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const testModule = { exports: {} };
  runInNewContext(compiled, { module: testModule, exports: testModule.exports, require: (name) => {
    if (name === './project-cashflow') return load('lib/project-cashflow.ts');
    if (name.startsWith('@/') && name.endsWith('.json')) return JSON.parse(readFileSync(resolve(root, name.slice(2)), 'utf8'));
    throw new Error(`Unexpected test import: ${name}`);
  } });
  return testModule.exports;
}
const { queryNumber, monthNumber, spendingShares, buildCashflowOutlook, allocateMonthlyDrivers } = load('lib/project-cashflow.ts');
const { buildPlanningCalibration } = load('lib/planning-calibration.ts');
const assumptions = { annualBaselinePct: 6, peakAiAnnualPctPoints: 1.25, localCapturePct: 36, lagMonths: 3, uncertaintyPct: 40 };
const config = { assetOutcome: 'SCHEDULE_HOSPITALS_DELAY_PRESSURE', durationYears: 2, projectStart: 2029, priceBasis: '2028-01', assumptions };
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const priceRow = (month, baseline, combined) => ({ month, cumulative_baseline_pct: baseline, cumulative_combined_pct: combined, cumulative_lower_pct: baseline, cumulative_upper_pct: combined + 1 });

test('empty/partial links preserve defaults; explicit zero is valid', () => {
  for (const value of [new URLSearchParams(), new URLSearchParams('baseline='), new URLSearchParams('baseline=Infinity'), new URLSearchParams('baseline=-1'), new URLSearchParams('baseline=13')]) assert.equal(queryNumber(value, 'baseline', 0, 12) ?? 3.5, 3.5);
  assert.equal(queryNumber(new URLSearchParams('baseline=0'), 'baseline', 0, 12), 0);
  assert.equal(queryNumber(new URLSearchParams('start=2029.5'), 'start', 2026, 2040, true), undefined);
});
test('dates reject malformed months', () => {
  assert.equal(monthNumber('2029-13'), null); assert.equal(monthNumber('2029-1'), null);
  assert.equal(monthNumber('2029-01') - monthNumber('2028-12'), 1);
});
test('profiles allocate the entire base budget exactly', () => {
  for (const profile of ['uniform', 'front_loaded', 'back_loaded', 'bell']) near(spendingShares(60, profile).reduce((a, b) => a + b, 0), 1);
});
test('cashflow weighting is not end-loaded whole-budget escalation', () => {
  const result = buildCashflowOutlook([priceRow('2029-01', 0, 0), priceRow('2029-02', 0, 10)], 100, 'uniform');
  near(result.aiIncrement, 5); near(result.combinedSpend, 105);
  near(result.monthly.reduce((sum, row) => sum + row.baseSpend, 0), 100);
});
test('back-loaded spending carries greater positive-growth exposure', () => {
  const rows = [priceRow('2029-01', 0, 0), priceRow('2029-02', 5, 10)];
  assert.ok(buildCashflowOutlook(rows, 100, 'back_loaded').combinedSpend > buildCashflowOutlook(rows, 100, 'front_loaded').combinedSpend);
});
test('price basis anchors first month and pre-construction escalation', () => {
  const same = buildPlanningCalibration({ ...config, priceBasis: '2029-01' });
  near(same.monthly_series[0].cumulative_combined_pct, 0);
  const earlier = buildPlanningCalibration(config);
  near(earlier.monthly_series[0].cumulative_baseline_pct, 6);
  assert.equal(earlier.monthly_series.length, 24);
  assert.equal(earlier.monthly_series.at(-1).month, '2030-12');
  assert.throws(() => buildPlanningCalibration({ ...config, priceBasis: '2030-01' }));
});
test('no AI and zero baseline preserve original budget', () => {
  const model = buildPlanningCalibration({ ...config, assumptions: { ...assumptions, annualBaselinePct: 0, peakAiAnnualPctPoints: 0 } });
  const result = buildCashflowOutlook(model.monthly_series, 1200, 'bell');
  near(result.combinedSpend, 1200); near(result.aiIncrement, 0);
});
test('totals reconcile and sensitivity remains ordered', () => {
  const result = buildCashflowOutlook(buildPlanningCalibration(config).monthly_series, 1200, 'bell');
  near(result.combinedSpend, 1200 + result.baselineEscalation + result.aiIncrement);
  assert.ok(result.lowSpend <= result.combinedSpend && result.combinedSpend <= result.highSpend);
});
test('missing, nonfinite or discontinuous monthly prices withhold dollars', () => {
  assert.equal(buildCashflowOutlook([priceRow('2029-01', null, 10)], 100, 'uniform'), null);
  assert.equal(buildCashflowOutlook([priceRow('2029-01', 0, NaN)], 100, 'uniform'), null);
  assert.equal(buildCashflowOutlook([priceRow('2029-01', 0, 0), priceRow('2029-03', 0, 1)], 100, 'uniform'), null);
});
test('monthly driver allocation reconciles without adding upstream cost', () => {
  const contributions = allocateMonthlyDrivers([82, 6, 6, 6], 0.1);
  near(contributions.reduce((a, b) => a + b, 0), 0.1);
  near(contributions[0], 0.082);
  assert.ok(allocateMonthlyDrivers([0, 0], 0).every((value) => value === 0));
  assert.ok(allocateMonthlyDrivers([null, 1], 0.1).every((value) => value === null));
});
