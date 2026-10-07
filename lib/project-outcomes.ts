/** Interpretation only: never changes schedule, pricing or assigns contractual liability. */
export function interpretProjectOutcomes(input: {
  incrementalDelayMonths: number | null;
  scenarioPricingCAD: number | null;
}) {
  for (const value of Object.values(input)) {
    if (value !== null && !Number.isFinite(value))
      throw new Error('Outcome values must be finite or explicitly unknown.');
  }
  return {
    version: 'project-outcomes-1',
    contractorCostPressure: {
      amountCAD: null,
      status: 'unquantified' as const,
      interpretation:
        'Competition can put pressure on contractor wages, procurement and margins. Actual contractor cost pressure is unknown; the entered owner exposure is not a contractor cost ledger.',
    },
    taxpayerCostExposure: {
      amountCAD: null,
      status: 'allocation-unresolved' as const,
      interpretation:
        'A taxpayer increment needs an exposed public commitment and an applicable contract allocation or relief entitlement. Fixed commitments do not automatically reprice. Shared risks and exceptions require evidence; unknown is not zero.',
    },
    deliveryRisk: {
      incrementalDelayMonths: input.incrementalDelayMonths,
      status:
        input.incrementalDelayMonths === null
          ? ('unknown' as const)
          : ('conditional-scenario' as const),
      interpretation:
        'The paired resource schedule tests an assumed shared trade pool. Delay can affect delivery even when the contractor bears cost risk. This is not an observed delay or proof of AI causation.',
    },
    enteredExposurePricing: {
      amountCAD: input.scenarioPricingCAD,
      status:
        input.scenarioPricingCAD === null
          ? ('unknown' as const)
          : ('conditional-scenario' as const),
      interpretation:
        'Scenario repricing of entered uncommitted exposure and overhead only. This arithmetic does not identify the final payer and is not added to either unknown cost category.',
    },
  };
}
export type ProjectOutcomes = ReturnType<typeof interpretProjectOutcomes>;

/** Public contract interpretation; separate from the frozen pilot evidence and model vintage. */
export const windsongContractContext = {
  school: 'South Windsong School',
  location: '560 Osborne Drive SW, Airdrie, Alberta',
  agreementExecuted: '2025-03-27',
  capitalRisk:
    'Base contractor risks are assigned in agreement section 2.5. The value-for-money report (page 14) assigns wage inflation to the contractor; material inflation is shared subject to specific exceptions.',
  publicExposurePaths:
    'Province-requested changes can use current labour costs. Qualifying tariff relief is a separate contractual pathway and does not establish AI causation. Indexed maintenance is separate from capital construction.',
  unknowns: [
    'Uncommitted school electrical amount',
    'Actual shared crews or contractors with CAL3',
    'Applicable exception, amount and public share',
  ],
  programme:
    'Public Schedule 17 identifies EllisDon Construction and Facilities; the detailed programme in Schedule 2 is omitted. Contract early availability May 31, 2027 conflicts with the summary May 1 date. Student opening is fall 2027; these milestones are not interchangeable.',
  qualification:
    'Source-based contract interpretation, not a quantified liability determination or a case-specific causal estimate. No whole-school-budget escalation is inferred.',
  sources: [
    {
      title: 'Six-school DBFM agreement — section 2.5 and Schedules 2 and 17',
      url: 'https://open.alberta.ca/publications/agreement-dbfm-six-new-schools',
    },
    {
      title: 'Value-for-money report — page 14 and availability summary',
      url: 'https://open.alberta.ca/publications/value-for-money-assessment-and-project-report-public-private-partnership-bundle-of-six-schools',
    },
    {
      title: 'Rocky View Schools — South Windsong location and opening',
      url: 'https://www.rockyview.ab.ca/about-rvs/building-our-student-spaces/southwindsong',
    },
  ],
};
