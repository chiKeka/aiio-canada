import test from 'node:test';
import assert from 'node:assert/strict';
import {
  interpretProjectOutcomes,
  windsongContractContext,
} from '../lib/project-outcomes.ts';

test('entered exposure arithmetic never assigns contractor pressure or taxpayer liability', () => {
  for (const pricing of [null, 0, 5e7, -100]) {
    const result = interpretProjectOutcomes({
      incrementalDelayMonths: 2,
      scenarioPricingCAD: pricing,
    });
    assert.equal(result.contractorCostPressure.amountCAD, null);
    assert.equal(result.taxpayerCostExposure.amountCAD, null);
    assert.equal(result.enteredExposurePricing.amountCAD, pricing);
    assert.equal(result.deliveryRisk.incrementalDelayMonths, 2);
    assert.equal(result.deliveryRisk.status, 'conditional-scenario');
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  }
});
test('unknown timing and zero conditional delay remain distinct without inventing dollar zeros', () => {
  assert.equal(
    interpretProjectOutcomes({
      incrementalDelayMonths: null,
      scenarioPricingCAD: null,
    }).deliveryRisk.status,
    'unknown',
  );
  const result = interpretProjectOutcomes({
    incrementalDelayMonths: 0,
    scenarioPricingCAD: 0,
  });
  assert.equal(result.deliveryRisk.status, 'conditional-scenario');
  assert.equal(result.deliveryRisk.incrementalDelayMonths, 0);
  assert.equal(result.taxpayerCostExposure.amountCAD, null);
});
test('nonfinite values cannot enter exported interpretation', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.throws(
      () =>
        interpretProjectOutcomes({
          incrementalDelayMonths: value,
          scenarioPricingCAD: null,
        }),
      /finite/,
    );
    assert.throws(
      () =>
        interpretProjectOutcomes({
          incrementalDelayMonths: null,
          scenarioPricingCAD: value,
        }),
      /finite/,
    );
  }
});
test('school context preserves separate risks, unknown exposure and conflicting milestones', () => {
  assert.match(
    windsongContractContext.capitalRisk,
    /wage inflation to the contractor/,
  );
  assert.match(
    windsongContractContext.capitalRisk,
    /material inflation is shared/,
  );
  assert.match(windsongContractContext.programme, /May 31.*May 1/);
  assert.match(
    windsongContractContext.publicExposurePaths,
    /maintenance is separate from capital/,
  );
  assert.ok(
    windsongContractContext.unknowns.includes(
      'Actual shared crews or contractors with CAL3',
    ),
  );
});
