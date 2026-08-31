'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, GitBranch, Zap } from 'lucide-react';

import { EvidencePill } from '@/components/site-shell';
import releaseData from '@/public/data/latest.json';

type PowerCase = 'low' | 'central' | 'high';

function boundedDisplayScore(rawScore: number) {
  return rawScore / (1 + rawScore);
}

export function ScenarioLab() {
  const [capex, setCapex] = useState(50);
  const [years, setYears] = useState(10);
  const [powerCase, setPowerCase] = useState<PowerCase>('central');
  const published = capex === 50 && years === 10;
  const scale = (capex / 50) * (10 / years);
  const power = releaseData.power_overlay.cases[powerCase];
  const annual = capex / years;
  const localBuild = capex * releaseData.scenario.modelled_component_share * releaseData.scenario.local_capture_share;
  const tradeRows = useMemo(() => releaseData.scenario.trade_pressure_order.map((item) => {
    const rawCentral = (item as typeof item & { raw_central?: number }).raw_central ?? item.central;
    return { ...item, displayed: boundedDisplayScore(rawCentral * scale) };
  }), [scale]);
  const maxTrade = Math.max(...tradeRows.map((item) => item.displayed), 0.01);

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <aside className="self-start rounded-xl border border-[#cbd6d0] bg-[#fbfaf5] p-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between"><h2 className="font-medium">Scenario controls</h2><EvidencePill status="scenario" /></div>
        <p className="mt-2 text-xs leading-5 text-[#52645f]">The immutable release is $50B over 2027–2036. Other settings are transparent linear interpolations for exploration, not model runs.</p>
        <label className="mt-7 block"><span className="flex justify-between text-xs font-medium"><span>Total AI infrastructure capex</span><output className="font-mono text-[#1b6962]">${capex}B</output></span><input aria-label="Total AI infrastructure capex in billions" className="scenario-range mt-4 w-full" max="100" min="10" onChange={(event) => setCapex(Number(event.target.value))} step="5" type="range" value={capex} /></label>
        <div className="mt-7"><p className="mb-3 text-xs font-medium">Delivery window</p><div className="grid grid-cols-3 gap-2">{[5, 10, 15].map((option) => <button aria-pressed={years === option} className={`rounded-lg border py-2 text-xs font-medium ${years === option ? 'border-[#247269] bg-[#ddede8] text-[#175950]' : 'border-[#d2dad5] bg-white text-[#667773]'}`} key={option} onClick={() => setYears(option)} type="button">{option} years</button>)}</div></div>
        <div className="mt-7"><p className="mb-3 text-xs font-medium">Independent power case</p><div className="grid grid-cols-3 gap-2">{(['low', 'central', 'high'] as PowerCase[]).map((option) => <button aria-pressed={powerCase === option} className={`rounded-lg border py-2 text-xs capitalize ${powerCase === option ? 'border-[#b7663b] bg-[#fff0e4] text-[#91431f]' : 'border-[#d2dad5] bg-white text-[#667773]'}`} key={option} onClick={() => setPowerCase(option)} type="button">{option}</button>)}</div></div>
        <div className="mt-7 rounded-lg bg-[#eef0e9] p-4"><p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#52645f]">Run status</p><p className="mt-2 text-sm font-medium text-[#274a4b]">{published ? 'Published v0.2 diagnostic' : 'Interface interpolation'}</p><p className="mt-1 text-xs leading-5 text-[#52645f]">{published ? 'Values reconcile to the release manifest.' : 'This configuration has not generated a new release artifact.'}</p></div>
      </aside>

      <div className="space-y-6">
        <section className="rounded-xl border border-[#e0b18b] bg-[#fff1e5] p-5 text-sm leading-6 text-[#815640]">
          <strong className="text-[#8d421e]">Uncalibrated structural diagnostic.</strong> These bounded display scores are not findings, forecasts, probabilities, measured effects, or delay percentages. A score of 0.24 does not mean a 24% delay; 54% of capex is outside the graph.
        </section>
        <section className="grid gap-3 sm:grid-cols-3">
          <Summary label="Annual capex flow" value={`$${annual.toFixed(1)}B`} note={`${years}-year arithmetic average`} />
          <Summary label="Local build envelope" value={`$${localBuild.toFixed(1)}B`} note="46% build share × 72% local capture" />
          <Summary label="Transfer proxy" value={`${(power.full_buildout.planning_transfer_proxy_mw / 1000).toFixed(2)} GW`} note={`${powerCase} independent MW overlay`} />
        </section>
        <section className="rounded-xl border border-[#d2dbd5] bg-[#fbfaf5] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-3 border-b border-[#e0e5e1] pb-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><GitBranch className="size-4 text-[#27766e]" /><h2 className="font-medium">Trade-pressure ordering</h2></div><p className="mt-1 text-xs text-[#52645f]">Bounded display index [0,1) · central assumed weights</p></div><span className="font-mono text-xs text-[#52645f]">raw scale ×{scale.toFixed(2)}</span></div>
          <div className="mt-6 space-y-5">{tradeRows.map((item, index) => <div key={item.node_id}><div className="mb-2 flex justify-between text-xs"><span><span className="mr-2 font-mono text-[#52645f]">0{index + 1}</span>{item.label}</span><span className="font-mono text-[#356c68]">{item.displayed.toFixed(3)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#e4e8e4]"><div className={`h-full rounded-full ${index === 0 ? 'bg-[#d46d39]' : 'bg-[#368c82]'}`} style={{ width: `${(item.displayed / maxTrade) * 100}%` }} /></div></div>)}</div>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[#d2dbd5] bg-[#fbfaf5] p-5"><div className="flex items-center gap-2"><Zap className="size-4 text-[#bd6133]" /><h2 className="font-medium">Independent power overlay</h2></div><dl className="mt-5 space-y-3 text-sm"><PowerRow label="IT load at full buildout" value={`${(power.assumptions.it_load_mw_at_full_buildout / 1000).toFixed(1)} GW`} /><PowerRow label="Facility peak" value={`${(power.full_buildout.facility_peak_mw / 1000).toFixed(1)} GW`} /><PowerRow label="Annual facility energy" value={`${(power.full_buildout.annual_energy_gwh / 1000).toFixed(1)} TWh`} /><PowerRow label="Grid-coincident demand" value={`${(power.full_buildout.grid_coincident_mw / 1000).toFixed(2)} GW`} /></dl></div>
          <div className="rounded-xl border border-[#e0b18b] bg-[#fff1e5] p-5"><div className="flex items-center gap-2 text-[#94471f]"><AlertTriangle className="size-4" /><h2 className="font-medium">Interpretation boundary</h2></div><p className="mt-4 text-sm leading-6 text-[#815640]">Power is independent of capex. Energy PUE affects annual energy, while a separate peak-to-IT factor affects peak demand. The transfer proxy is not a project plan, available-capacity statement or AESO needs assessment.</p><p className="mt-4 text-xs text-[#6d4b3b]">{releaseData.power_overlay.structural_test_banner}</p></div>
        </section>
        <section className="rounded-xl border border-[#d2dbd5] bg-[#eef0e9] p-5 sm:p-7"><h2 className="font-medium">Dominant published path</h2><div className="mt-5 flex flex-wrap items-center gap-2">{releaseData.scenario.dominant_outcome_paths[0].node_path.map((node, index) => <span className="contents" key={`${node}-${index}`}><span className="rounded-full border border-[#c6d2cc] bg-white px-3 py-1.5 text-xs">{node.replaceAll('_', ' ').toLowerCase()}</span>{index < releaseData.scenario.dominant_outcome_paths[0].node_path.length - 1 ? <span className="text-[#52645f]">→</span> : null}</span>)}</div><p className="mt-4 text-xs leading-5 text-[#52645f]">This is a declared demand-to-resource-to-delay-pressure mechanism. It does not predict a specific project delay. The contribution peaks in {releaseData.scenario.dominant_outcome_paths[0].calendar_year} under the central structural case.</p></section>
        <section className="rounded-xl border border-[#d2dbd5] bg-[#fbfaf5] p-5 sm:p-7"><h2 className="font-medium">Sensitivity envelope</h2><p className="mt-1 text-xs leading-5 text-[#52645f]">One-at-a-time checks show which assumptions drive scale. Joint cases are stress tests, not probability bounds.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{releaseData.scenario.sensitivity.filter((item) => ['joint_lower_pressure', 'baseline', 'joint_higher_pressure'].includes(item.sensitivity_id)).map((item) => <div className="rounded-lg border border-[#dbe1dd] bg-white p-4" key={item.sensitivity_id}><p className="text-xs font-medium">{item.label}</p><p className="mt-3 font-mono text-xl text-[#165d58]">{item.top_resource.pressure_score.toFixed(2)}</p><p className="mt-1 text-[10px] leading-4 text-[#52645f]">Top trade: {item.top_resource.label} · {item.top_resource.calendar_year}</p></div>)}</div></section>
      </div>
    </div>
  );
}

function Summary({ label, value, note }: { label: string; value: string; note: string }) { return <div className="rounded-xl border border-[#d2dbd5] bg-[#fbfaf5] p-5"><p className="font-mono text-2xl font-semibold text-[#165d58]">{value}</p><p className="mt-2 text-xs font-medium">{label}</p><p className="mt-1 text-[10px] leading-4 text-[#52645f]">{note}</p></div>; }
function PowerRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-[#e1e5e1] pb-3 last:border-0"><dt className="text-[#52645f]">{label}</dt><dd className="font-mono font-medium text-[#2a5453]">{value}</dd></div>; }
