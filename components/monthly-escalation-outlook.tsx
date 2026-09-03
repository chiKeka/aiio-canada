'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CircleAlert, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { buildPlanningCalibration, type MonthlyEscalationCalibration, type PlanningAssumptions } from '@/lib/planning-calibration';

export type { MonthlyEscalationCalibration } from '@/lib/planning-calibration';

const chartConfig = {
  baseline_mom_pct: { label: 'Baseline', color: '#75aebe' },
  ai_increment_mom_pct: { label: 'Data-centre increment', color: '#ef9664' },
  combined_mom_pct: { label: 'Combined', color: '#61cfc1' },
  cumulative_baseline_pct: { label: 'Cumulative baseline', color: '#75aebe' },
  cumulative_lower_pct: { label: 'Low combined path', color: '#9ac3ca' },
  cumulative_upper_pct: { label: 'High combined path', color: '#ef9664' },
  cumulative_combined_pct: { label: 'Central combined path', color: '#61cfc1' },
} satisfies ChartConfig;

export function MonthlyEscalationOutlook({ assumptions, budgetMillions, calibration, contingencyPct, onAssumptionsChange, priceBasis, projectStart, durationYears, assetOutcome }: {
  calibration: MonthlyEscalationCalibration;
  assumptions: PlanningAssumptions;
  budgetMillions: number;
  contingencyPct: number;
  onAssumptionsChange: (value: PlanningAssumptions) => void;
  priceBasis: string;
  projectStart: number;
  durationYears: number;
  assetOutcome: string;
}) {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedMitigations, setSelectedMitigations] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<'monthly' | 'cumulative'>('cumulative');
  const isOfficial = calibration.status === 'calibrated' && calibration.publication_boundary.monthly_ai_increment_authorized;
  const planning = useMemo(() => buildPlanningCalibration({ assetOutcome, durationYears, projectStart, assumptions }), [assetOutcome, assumptions, durationYears, projectStart]);
  const active = isOfficial ? calibration : planning;
  const chartRows = active.monthly_series;
  const driverRows = active.drivers;
  const activeDriver = driverRows.find((driver) => driver.driver_id === selectedDriver) ?? driverRows[0];
  const primary = driverRows.filter((driver) => driver.tier === 'primary');
  const secondary = driverRows.filter((driver) => driver.tier === 'secondary');
  const finalRow = chartRows.at(-1);
  const cumulativeAi = finalRow?.cumulative_ai_increment_pct ?? null;
  const scenarioDollars = cumulativeAi === null ? null : budgetMillions * cumulativeAi / 100;

  return <div className="grid h-full min-h-[620px] gap-4 xl:min-h-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
    <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#72cfc3]">Monthly exposure</p><h2 className="mt-1 text-2xl font-medium tracking-[-0.035em]">Escalation path</h2></div>
        <span className={`rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em] ${isOfficial ? 'border-[#61cfc1]/35 bg-[#61cfc1]/10 text-[#a9eee4]' : 'border-[#ef9664]/35 bg-[#ef9664]/10 text-[#ffc6a3]'}`}>{isOfficial ? `calibrated · ${calibration.as_of_date}` : 'planning sandbox · not calibrated'}</span>
      </div>
      {!isOfficial ? <AssumptionControls assumptions={assumptions} setAssumptions={onAssumptionsChange} /> : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <Metric label="Current combined MoM" value={latest(chartRows, 'combined_mom_pct')} tone="teal" />
        <Metric label="Cumulative baseline" value={finalRow?.cumulative_baseline_pct ?? null} tone="blue" />
        <Metric label="Cumulative AI scenario" value={cumulativeAi} tone="orange" />
        <DollarMetric label="Scenario dollars at risk" value={scenarioDollars} />
      </div>
      <p className="mt-2 text-[9px] text-[#78949a]">Price basis {priceBasis || 'not supplied'} · existing contingency ${(budgetMillions * contingencyPct / 100).toFixed(1)}M · scenario exposure does not alter the approved estimate.</p>
      <div className="relative mt-4 min-h-[250px] flex-1 overflow-hidden rounded-2xl border border-white/8 bg-[#081f28] p-3"><div className="absolute right-3 top-3 z-10 flex rounded-lg border border-white/10 bg-[#071c25] p-0.5">{(['cumulative','monthly'] as const).map((mode) => <button aria-pressed={chartMode === mode} className={`rounded-md px-2 py-1 text-[8px] uppercase tracking-[.08em] ${chartMode === mode ? 'bg-[#dff7f1] text-[#113b3b]' : 'text-[#8fa8ae]'}`} key={mode} onClick={() => setChartMode(mode)} type="button">{mode}</button>)}</div>
        <ChartContainer className="h-full min-h-[250px] w-full aspect-auto" config={chartConfig}>
          <AreaChart data={chartRows} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
            <defs><linearGradient id="combinedFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#61cfc1" stopOpacity={0.28} /><stop offset="100%" stopColor="#61cfc1" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
            <XAxis axisLine={false} dataKey="month" interval="preserveStartEnd" tick={{ fill: '#78949a', fontSize: 9 }} tickLine={false} tickFormatter={(value) => String(value).slice(2, 7)} />
            <YAxis axisLine={false} tick={{ fill: '#78949a', fontSize: 9 }} tickFormatter={(value) => `${value}%`} tickLine={false} width={34} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartMode === 'monthly' ? <><Area dataKey="baseline_mom_pct" fill="transparent" stroke="var(--color-baseline_mom_pct)" strokeWidth={2} type="monotone" /><Area dataKey="ai_increment_mom_pct" fill="transparent" stroke="var(--color-ai_increment_mom_pct)" strokeDasharray="5 4" strokeWidth={2} type="monotone" /><Area dataKey="combined_mom_pct" fill="url(#combinedFill)" stroke="var(--color-combined_mom_pct)" strokeWidth={3} type="monotone" /></> : <><Area dataKey="cumulative_lower_pct" fill="transparent" stroke="var(--color-cumulative_lower_pct)" strokeDasharray="3 4" strokeWidth={1} type="monotone" /><Area dataKey="cumulative_upper_pct" fill="transparent" stroke="var(--color-cumulative_upper_pct)" strokeDasharray="3 4" strokeWidth={1} type="monotone" /><Area dataKey="cumulative_baseline_pct" fill="transparent" stroke="var(--color-cumulative_baseline_pct)" strokeWidth={2} type="monotone" /><Area dataKey="cumulative_combined_pct" fill="url(#combinedFill)" stroke="var(--color-cumulative_combined_pct)" strokeWidth={3} type="monotone" /></>}
          </AreaChart>
        </ChartContainer>
      </div>
      <DriverBands primary={primary} secondary={secondary} selectedDriver={activeDriver?.driver_id ?? null} setSelectedDriver={setSelectedDriver} />
    </section>

    <section className="grid min-h-0 gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:grid-rows-[1fr_1fr]">
      <NodalPanel calibration={active} driver={activeDriver} isCalibrated={isOfficial} />
      <MitigationPanel calibration={active} driver={activeDriver} selected={selectedMitigations} setSelected={setSelectedMitigations} />
    </section>
  </div>;
}

function DriverBands({ primary, secondary, selectedDriver, setSelectedDriver }: { primary: MonthlyEscalationCalibration['drivers']; secondary: MonthlyEscalationCalibration['drivers']; selectedDriver: string | null; setSelectedDriver: (id: string) => void }) {
  return <div className="mt-4 grid gap-3 md:grid-cols-2"><DriverGroup label="Primary drivers" rows={primary} selectedDriver={selectedDriver} setSelectedDriver={setSelectedDriver} tone="orange" /><DriverGroup label="Secondary effects" rows={secondary} selectedDriver={selectedDriver} setSelectedDriver={setSelectedDriver} tone="blue" /></div>;
}

function DriverGroup({ label, rows, selectedDriver, setSelectedDriver, tone }: { label: string; rows: MonthlyEscalationCalibration['drivers']; selectedDriver: string | null; setSelectedDriver: (id: string) => void; tone: 'orange' | 'blue' }) {
  return <div><p className="mb-2 text-[8px] uppercase tracking-[0.14em] text-[#78949a]">{label}</p><div className="flex flex-wrap gap-1.5">{rows.map((row) => <button className={`rounded-full border px-2.5 py-1.5 text-[9px] transition ${selectedDriver === row.driver_id ? tone === 'orange' ? 'border-[#ef9664] bg-[#ef9664]/18 text-[#ffd0b4]' : 'border-[#75aebe] bg-[#75aebe]/18 text-[#cae7ed]' : 'border-white/10 bg-white/4 text-[#91a8ad] hover:text-white'}`} key={row.driver_id} onClick={() => setSelectedDriver(row.driver_id)} type="button">{row.label}{row.contribution_pct_points === null ? '' : ` · ${signed(row.contribution_pct_points)}pp`}</button>)}</div></div>;
}

function AssumptionControls({ assumptions, setAssumptions }: { assumptions: PlanningAssumptions; setAssumptions: (value: PlanningAssumptions) => void }) {
  const controls: Array<[keyof PlanningAssumptions, string, number, number, number, string]> = [
    ['annualBaselinePct', 'Baseline', 0, 12, .1, '%/yr'], ['peakAiAnnualPctPoints', 'AI peak', 0, 8, .05, 'pp/yr'],
    ['localCapturePct', 'Local capture', 5, 80, 1, '%'], ['lagMonths', 'Lag', 0, 24, 1, 'mo'],
  ];
  return <div className="mt-3 grid gap-2 rounded-xl border border-white/8 bg-[#081f28] p-3 sm:grid-cols-4"><div className="col-span-full flex items-center gap-2 text-[8px] uppercase tracking-[.12em] text-[#78949a]"><SlidersHorizontal className="size-3" /> Visible planning assumptions</div>{controls.map(([key, label, min, max, step, unit]) => <label className="block" key={key}><span className="flex justify-between text-[8px] uppercase tracking-[.08em] text-[#78949a]"><span>{label}</span><b className="font-mono text-[#dff7f1]">{assumptions[key]} {unit}</b></span><input aria-label={label} className="scenario-range mt-2 w-full" max={max} min={min} onChange={(event) => setAssumptions({ ...assumptions, [key]: Number(event.target.value) })} step={step} type="range" value={assumptions[key]} /></label>)}</div>;
}

function NodalPanel({ calibration, driver, isCalibrated }: { calibration: MonthlyEscalationCalibration; driver: MonthlyEscalationCalibration['drivers'][number] | undefined; isCalibrated: boolean }) {
  const related = calibration.nodes.filter((node) => driver?.node_ids.includes(node.node_id));
  const nodes = related.length ? related : [{ node_id: 'shock', label: 'AI build-out', layer: 'shock', pressure_score: null }, { node_id: 'driver', label: driver?.label ?? 'Driver', layer: 'constraint', pressure_score: null }, { node_id: 'cost', label: 'Project cost', layer: 'outcome', pressure_score: null }];
  return <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><div className="flex items-center justify-between"><p className="text-[9px] uppercase tracking-[0.14em] text-[#72cfc3]">Nodal relationship</p><span className="font-mono text-[9px] text-[#78949a]">{isCalibrated ? `${calibration.edges.length} verified edges` : `${calibration.edges.length} assumed edges`}</span></div><div className="mt-5 flex flex-1 items-center justify-between gap-2">{nodes.slice(0, 3).map((node, index) => <div className="contents" key={node.node_id}>{index > 0 ? <ArrowRight className="size-4 shrink-0 text-[#ef9664]" /> : null}<div className="grid min-h-28 min-w-0 flex-1 place-items-center rounded-full border border-[#61cfc1]/25 bg-[#081f28] p-3 text-center"><div><p className="text-[8px] uppercase tracking-[0.12em] text-[#78949a]">{node.layer}</p><p className="mt-2 text-[10px] font-medium leading-4 text-[#dff7f1]">{node.label}</p><p className="mt-1 font-mono text-[9px] text-[#72cfc3]">{node.pressure_score === null ? '—' : node.pressure_score.toFixed(2)}</p></div></div></div>)}</div></div>;
}

function MitigationPanel({ calibration, driver, selected, setSelected }: { calibration: MonthlyEscalationCalibration; driver: MonthlyEscalationCalibration['drivers'][number] | undefined; selected: string[]; setSelected: (value: string[]) => void }) {
  const matched = calibration.mitigations.filter((item) => item.driver_id === driver?.driver_id);
  const placeholders = ['Early market test', 'Package strategy', 'Lead-time lock'];
  const rows = matched.length ? matched : placeholders.map((label) => ({ label, timing: 'pending', evidence_status: 'mapping pending' }));
  return <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><div className="flex items-center justify-between"><p className="text-[9px] uppercase tracking-[0.14em] text-[#72cfc3]">Mitigation</p><ShieldCheck className="size-4 text-[#72cfc3]" /></div><p className="mt-3 text-lg font-medium">{driver?.label ?? 'Select a driver'}</p><div className="mt-4 grid gap-2">{rows.map((item) => { const key = `${driver?.driver_id}:${item.label}`; const checked = selected.includes(key); return <button aria-pressed={checked} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left ${checked ? 'border-[#61cfc1]/45 bg-[#61cfc1]/12' : 'border-white/8 bg-[#081f28]'}`} key={item.label} onClick={() => setSelected(checked ? selected.filter((value) => value !== key) : [...selected, key])} type="button"><span className="text-[10px] text-[#d1dfe1]">{checked ? '✓ ' : ''}{item.label}</span><span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#78949a]">{item.timing}</span></button>; })}</div><div className="mt-auto pt-4 text-[8px] uppercase tracking-[0.1em] text-[#efb18d]"><div className="flex items-center gap-2"><CircleAlert className="size-3" /> {selected.length} actions selected · exposure unchanged</div><p className="mt-1 normal-case tracking-normal text-[#8fa8ae]">Selection records a decision response; no unsupported mitigation credit is applied.</p></div></div>;
}

function Metric({ label, tone, value }: { label: string; tone: 'blue' | 'orange' | 'teal'; value: number | null }) { const color = tone === 'orange' ? 'text-[#ffb184]' : tone === 'blue' ? 'text-[#abd2da]' : 'text-[#a9eee4]'; return <div className="rounded-xl border border-white/8 bg-[#081f28] p-3"><p className={`font-mono text-xl ${color}`}>{value === null ? '—' : signed(value)}</p><p className="mt-2 text-[8px] uppercase tracking-[0.1em] text-[#78949a]">{label}</p></div>; }
function DollarMetric({ label, value }: { label: string; value: number | null }) { return <div className="rounded-xl border border-[#ef9664]/25 bg-[#ef9664]/8 p-3"><p className="font-mono text-xl text-[#ffb184]">{value === null ? '—' : `$${value.toFixed(1)}M`}</p><p className="mt-2 text-[8px] uppercase tracking-[0.1em] text-[#c49478]">{label}</p></div>; }
function latest(rows: MonthlyEscalationCalibration['monthly_series'], key: 'baseline_mom_pct' | 'ai_increment_mom_pct' | 'combined_mom_pct') { return rows.at(-1)?.[key] ?? null; }
function signed(value: number) { return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`; }
