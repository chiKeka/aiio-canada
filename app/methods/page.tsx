import { CheckCircle2, GitBranch, Layers3, ShieldCheck } from 'lucide-react';

import {
  EvidencePill,
  PageIntro,
  SiteFooter,
  SiteHeader,
} from '@/components/site-shell';
import releaseData from '@/public/data/latest.json';
import historicalEnvelope from '@/data/model-runs/alberta_bcpi_historical_envelope_v0.1.json';

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
