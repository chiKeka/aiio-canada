import { ScenarioLab } from '@/components/scenario-lab';
import {
  EvidencePill,
  PageIntro,
  SiteFooter,
  SiteHeader,
} from '@/components/site-shell';
import releaseData from '@/public/data/latest.json';

type PowerEvidence = {
  requested_load: {
    latest_application_period: string;
    latest_requested_load_mw: number;
  };
  phase1: {
    allocated_mw: number;
  };
  transmission_boundary: {
    additional_transmission_required_for_50b_counterfactual_mw: number | null;
  };
};

export default function ScenarioPage() {
  const evidence = (
    releaseData as typeof releaseData & { power_evidence?: PowerEvidence }
  ).power_evidence;
  return (
    <main className="min-h-screen bg-[#f5f3ec] text-[#17343d]">
      <SiteHeader />
      <PageIntro
        eyebrow="Scenario laboratory"
        title="What changes when $50B lands in Alberta?"
        description="Compare four versioned stress cases that isolate timing and local capture while keeping the total program, component mix and graph fixed. Each choice is a reproducible structural run—not a forecast, finding, cost-escalation estimate or project-delay prediction."
      />
      {evidence ? <ObservedPowerBoundary evidence={evidence} /> : null}
      <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <ScenarioLab />
      </section>
      <SiteFooter />
    </main>
  );
}

function ObservedPowerBoundary({ evidence }: { evidence: PowerEvidence }) {
  const transmission =
    evidence.transmission_boundary
      .additional_transmission_required_for_50b_counterfactual_mw;
  return (
    <section className="border-b border-[#d5ddd8] bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <EvidencePill status="observed" />
          <span className="font-mono text-xs text-[#52645f]">
            AESO-published quantities · independently checked against archived sources
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <PowerMetric
            label={`Requested load · ${evidence.requested_load.latest_application_period}`}
            value={`${(evidence.requested_load.latest_requested_load_mw / 1_000).toFixed(1)} GW`}
            note="Requests, not contracts or a forecast"
          />
          <PowerMetric
            label="Phase 1 allocated limit"
            value={`${(evidence.phase1.allocated_mw / 1_000).toFixed(1)} GW`}
            note="Executed load contracts; not connected or in-service load"
          />
          <PowerMetric
            label="$50B additional transmission"
            value={transmission === null ? 'Unknown' : `${transmission} MW`}
            note="Requires locations and system studies"
          />
        </div>
        <div className="mt-4 rounded-xl border border-[#e1b48e] bg-[#fff3e8] p-4 text-sm leading-6 text-[#825a47]">
          Requested load, allocated limits, executed contracts, connected load,
          and forecasts are different quantities. AESO&apos;s statement that no
          new transmission system reinforcement was required applies only to
          its 1.2 GW interim approach through 2028 on the existing transmission
          system. It does not establish transmission needs for remaining
          requests, Phase 2, other locations, or the separate $50B
          counterfactual.
        </div>
      </div>
    </section>
  );
}

function PowerMetric({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string;
}) {
  return (
    <article className="rounded-xl border border-[#d3dcd6] bg-[#fbfaf5] p-5">
      <p className="font-mono text-3xl font-semibold text-[#155d59]">{value}</p>
      <h2 className="mt-3 text-sm font-medium">{label}</h2>
      <p className="mt-1 text-xs text-[#61726d]">{note}</p>
    </article>
  );
}
