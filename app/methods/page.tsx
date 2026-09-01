import { CheckCircle2, GitBranch, Layers3, ShieldCheck } from 'lucide-react';

import {
  EvidencePill,
  PageIntro,
  SiteFooter,
  SiteHeader,
} from '@/components/site-shell';
import releaseData from '@/public/data/latest.json';
import historicalEnvelope from '@/data/model-runs/alberta_bcpi_historical_envelope_v0.1.json';
import historicalAnalogMatrix from '@/data/model-runs/alberta_project_historical_analog_matrix_v0.1.json';
import referenceCostReview from '@/data/model-runs/alberta_reference_cost_review_package_v0.1.json';
import programGates from '@/data/governance/program-gates.json';
import informationSectorCapex from '@/data/model-runs/information_sector_construction_capex_screen_v0.1.json';
import cmaReferenceBaseline from '@/data/model-runs/vancouver_toronto_montreal_bcpi_reference_baseline_v0.1.json';
import regionalMacroControls from '@/data/model-runs/regional_macro_controls_canada_v0.1.json';
import provinceLinkedBaseline from '@/data/model-runs/bc_on_qc_province_linked_reference_baseline_v0.1.json';

const methodSteps = [
  [
    '01',
    'Register',
    'Identify an authoritative public source and record its publisher, URL, vintage, access method, licence note and update frequency.',
  ],
  [
    '02',
    'Retrieve',
    'Archive the raw response by content hash and add a retrieval manifest. Revisions become new records.',
  ],
  [
    '03',
    'Normalize',
    'Transform into stable observations with units, geography, period, source ID, quality flags and evidence status.',
  ],
  [
    '04',
    'Model',
    'Apply a sealed scenario to a typed graph. Lag, sign, magnitude range and absorption remain explicit on every edge; state retention is explicit on nodes.',
  ],
  [
    '05',
    'Validate',
    'Run identity, persistence, sign, lag, mass-bound, additivity, cycle, sensitivity, determinism and golden-release tests.',
  ],
  [
    '06',
    'Release',
    'Website, downloads and workbook consume the same immutable manifest and file hashes.',
  ],
];

export default function MethodsPage() {
  const reviewerStates = Object.entries(programGates.independent_review);
  const evidenceScreens = releaseData as typeof releaseData & {
    material_cost_screen?: { limitations: string[] };
    public_project_exposure?: { limitations: string[] };
    power_evidence?: { limitations: string[] };
  };
  const limitations = [
    ...releaseData.scenario.limitations,
    ...releaseData.labour_pressure.limitations,
    ...(evidenceScreens.material_cost_screen?.limitations ?? []),
    ...(evidenceScreens.public_project_exposure?.limitations ?? []),
    ...(evidenceScreens.power_evidence?.limitations ?? []),
    ...historicalEnvelope.limitations,
    ...historicalAnalogMatrix.limitations,
    ...informationSectorCapex.limitations,
    ...cmaReferenceBaseline.limitations,
    ...regionalMacroControls.limitations,
    ...provinceLinkedBaseline.limitations,
  ];
  return (
    <main className="min-h-screen bg-[#f5f3ec] text-[#17343d]">
      <SiteHeader />
      <PageIntro
        eyebrow="Research method"
        title="A pipeline of evidence, not a side model."
        description="The graph is the analysis engine inside a larger reproducible program. Source records, transformations, scenarios, tests and publication artifacts are versioned so a reader can follow a result back to its origin."
      />
      <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {methodSteps.map(([number, title, text]) => (
            <article
              className="rounded-xl border border-[#d3dcd6] bg-[#fbfaf5] p-5"
              key={number}
            >
              <span className="font-mono text-xs text-[#2b776f]">{number}</span>
              <h2 className="mt-5 text-lg font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#52645f]">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-y border-[#dfb18d] bg-[#fff1e5]">
        <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2 text-[#94471f]">
                <ShieldCheck className="size-5" />
                <span className="font-mono text-xs uppercase tracking-[0.14em]">
                  Independent modelling gate
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-medium tracking-[-0.025em]">
                The packet is ready. The verdict is not.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#805843]">
                The Alberta E1 review instrument hash-locks the model artifact,
                implementation, tests and claim boundaries. It cannot authorize
                publication itself, and a future pass would apply only to an
                individually validated reference-index horizon.
              </p>
              <dl className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ['Locked inputs', referenceCostReview.input_manifest.length],
                  [
                    'Required criteria',
                    referenceCostReview.required_criteria.length,
                  ],
                  [
                    'Eligible horizons',
                    referenceCostReview.facts_to_reconcile
                      .gate_passing_horizons.length,
                  ],
                ].map(([label, value]) => (
                  <div
                    className="rounded-lg border border-[#e0b18b] bg-[#fff8f1] p-3"
                    key={label}
                  >
                    <dt className="text-xs text-[#8d654f]">{label}</dt>
                    <dd className="mt-1 font-mono text-xl text-[#743b20]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="space-y-3">
              {reviewerStates.map(([reviewer, gate]) => (
                <article
                  className="rounded-lg border border-[#e0b18b] bg-[#fff8f1] p-4"
                  key={reviewer}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-mono text-xs uppercase tracking-[0.12em] text-[#743b20]">
                      {reviewer} review
                    </h3>
                    <span className="rounded-full border border-[#d59d74] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#94471f]">
                      {gate.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#805843]">
                    {gate.reason}
                  </p>
                </article>
              ))}
              <p className="text-xs leading-5 text-[#8d654f]">
                No reviewer output, approval or replacement parameter is
                inferred from tool availability. All public projection,
                project-cost and AI-attribution fields remain withheld.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-[#0b2a36] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:px-12 lg:py-16">
          <div>
            <div className="flex items-center gap-2 text-[#86cfc3]">
              <GitBranch className="size-4" />
              <span className="font-mono text-xs uppercase tracking-[0.14em]">
                PSPE/S3 adaptation
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-medium tracking-[-0.035em]">
              Signed paths with explicit limits.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#a9bcc2]">
              The dissertation method contributes directed graph propagation,
              damping and path interpretation. AIIO adds evidence lineage,
              frozen edge semantics, temporal lags, retained states, scenario
              isolation and release controls.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'Dense-graph centrality is not used as a proxy for importance.',
              'The archived conserved-mass origin ranking is excluded.',
              'Positive and negative paths are retained separately.',
              'Absorption and retention receive explicit sensitivity tests.',
              'Raw pressure is transformed as raw ÷ (1 + raw) for bounded public display only.',
              'CAD pressure and MW power quantities use separate artifacts.',
              'Historical index envelopes are descriptive; predictive and causal calibration remain gated.',
              'Historical project analogs preserve complete past trajectories; their dollar equivalents are stress tests, not forecasts or AI premiums.',
            ].map((item) => (
              <div
                className="flex gap-3 rounded-lg border border-white/10 bg-white/4 p-4 text-sm leading-5 text-[#d6e1e4]"
                key={item}
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#77c3b7]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="size-4 text-[#28776e]" />
              <h2 className="text-xl font-medium">Epistemic contract</h2>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['observed', 'Directly reported by a public source.'],
                ['inferred', 'Derived through a disclosed transformation.'],
                [
                  'assumed',
                  'Selected parameter with rationale and sensitivity range.',
                ],
                [
                  'scenario',
                  'Counterfactual input or output; never a forecast.',
                ],
              ].map(([status, text]) => (
                <div
                  className="flex items-start gap-3 rounded-lg border border-[#d5ddd8] bg-[#fbfaf5] p-4"
                  key={status}
                >
                  <EvidencePill status={status} />
                  <p className="text-sm text-[#647570]">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#e0b18b] bg-[#fff1e5] p-6">
            <div className="flex items-center gap-2 text-[#94471f]">
              <ShieldCheck className="size-5" />
              <h2 className="text-xl font-medium">Current model limitations</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#805843]">
              Scenario and evidence-screen boundaries are published together
              here; none is a forecast.
            </p>
            <ul className="mt-5 space-y-3">
              {limitations.map((item) => (
                <li
                  className="flex gap-3 text-sm leading-6 text-[#805843]"
                  key={item}
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#c06b3c]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
