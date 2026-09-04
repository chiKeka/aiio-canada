'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { type MonthlyEscalationCalibration, type PlanningAssumptions } from '@/lib/planning-calibration';
import { buildDecisionOutlook } from '@/lib/decision-outlook';
import { allocateMonthlyDrivers, SPENDING_PROFILES, type SpendingProfile } from '@/lib/project-cashflow';
export type { MonthlyEscalationCalibration } from '@/lib/planning-calibration';

const chartConfig = {
  baseline_mom_pct: { label: 'Baseline % MoM', color: '#75aebe' },
  ai_increment_mom_pct: { label: 'AI scenario (pp MoM)', color: '#ef9664' },
  combined_mom_pct: { label: 'Combined % MoM', color: '#61cfc1' },
  cumulative_baseline_pct: { label: 'Baseline % since price basis', color: '#75aebe' },
  cumulative_lower_pct: { label: 'Low combined %', color: '#9ac3ca' },
  cumulative_upper_pct: { label: 'High combined %', color: '#ef9664' },
  cumulative_combined_pct: { label: 'Central combined %', color: '#61cfc1' },
  baseSpend: { label: 'Base spend ($M)', color: '#75aebe' },
  combinedSpend: { label: 'Scenario spend ($M)', color: '#61cfc1' },
} satisfies ChartConfig;

type Props = {
  selectedMonth: string | null; setSelectedMonth: (value: string) => void;
  selectedDriver: string | null; setSelectedDriver: (value: string) => void;
  calibration: MonthlyEscalationCalibration; assumptions: PlanningAssumptions;
  budgetMillions: number; contingencyPct: number;
  onAssumptionsChange: (value: PlanningAssumptions) => void;
  onSpendingProfileChange: (value: SpendingProfile) => void;
  spendingProfile: SpendingProfile; priceBasis: string;
  projectStart: number; durationYears: number; assetOutcome: string;
};

export function MonthlyEscalationOutlook({ selectedMonth, setSelectedMonth, selectedDriver, setSelectedDriver, assumptions, budgetMillions, calibration, contingencyPct, onAssumptionsChange, onSpendingProfileChange, spendingProfile, priceBasis, projectStart, durationYears, assetOutcome }: Props) {
  const [selectedMitigations, setSelectedMitigations] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<'monthly' | 'cumulative' | 'spending'>('spending');
  const assessment = useMemo(() => buildDecisionOutlook({ assetOutcome, durationYears, projectStart, assumptions, priceBasis, budgetMillions, spendingProfile }, calibration), [assetOutcome, assumptions, durationYears, projectStart, priceBasis, budgetMillions, spendingProfile, calibration]);
  if (!assessment) return <section className="rounded-2xl border border-[#ef9664]/40 bg-[#0d2933] p-6" role="alert">Results withheld: enter a valid project window, positive budget and price basis no later than project start.</section>;
  const { active, cashflow, isOfficial } = assessment;
  const rows = active.monthly_series.map((row, i) => ({ ...row, ...cashflow?.monthly[i] }));
  const selectedIndex = Math.max(0, rows.findIndex((row) => row.month === selectedMonth));
  const month = rows[selectedIndex];
  // Proportional assumption allocation, not empirical monthly attribution.
  const contributions = allocateMonthlyDrivers(active.drivers.map((driver) => driver.contribution_pct_points), isOfficial ? null : month.ai_increment_mom_pct);
  const drivers = active.drivers.map((driver, i) => ({ ...driver, contribution_pct_points: contributions[i] }));
  const driver = drivers.find((row) => row.driver_id === selectedDriver) ?? drivers[0];
  const chartKeys = chartMode === 'spending' ? ['baseSpend', 'combinedSpend'] : chartMode === 'monthly' ? ['baseline_mom_pct', 'ai_increment_mom_pct', 'combined_mom_pct'] : ['cumulative_lower_pct', 'cumulative_upper_pct', 'cumulative_baseline_pct', 'cumulative_combined_pct'];
  return <div className="grid h-full min-h-0 gap-4 overflow-y-auto xl:grid-cols-[minmax(0,1.4fr)_minmax(310px,.6fr)]">
    <section className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-medium">Monthly outlook</h2><span className="rounded-full border border-[#ef9664]/35 px-3 py-1 text-xs text-[#ffc6a3]">{isOfficial ? 'Scope-matched calibrated input' : 'Assumption scenario · not a validated estimate'}</span></div>
      {!isOfficial ? <AssumptionControls assumptions={assumptions} onChange={onAssumptionsChange} /> : null}
      <label className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm"><span>Assumed spending profile</span><NativeSelect className="[&>select]:border-white/15 [&>select]:bg-[#081f28] [&>select]:text-white" aria-label="Spending profile" onChange={(event) => onSpendingProfileChange(event.target.value as SpendingProfile)} value={spendingProfile}>{Object.entries(SPENDING_PROFILES).map(([key, label]) => <NativeSelectOption key={key} value={key}>{label}</NativeSelectOption>)}</NativeSelect></label>
      <div className="mt-3 grid gap-2 sm:grid-cols-3"><Readout label="Total baseline escalation" value={money(cashflow?.baselineEscalation)} /><Readout label="Total AI scenario increment" value={money(cashflow?.aiIncrement)} /><Readout label="Total scenario spend" value={money(cashflow?.combinedSpend)} /></div>
      <p className="mt-2 text-xs leading-5 text-[#a9bcc1]">{priceBasis} price basis · budget excludes contingency. Low–high spend: {money(cashflow?.lowSpend)}–{money(cashflow?.highSpend)}. Contingency: {money(budgetMillions * contingencyPct / 100)} (separate; not netted against escalation).</p>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Chart view">{(['spending', 'monthly', 'cumulative'] as const).map((mode) => <button aria-pressed={chartMode === mode} className={`rounded-lg px-3 py-2 text-sm ${chartMode === mode ? 'bg-[#dff7f1] text-[#113b3b]' : 'border border-white/15 text-[#b5cbd0]'}`} key={mode} onClick={() => setChartMode(mode)} type="button">{mode === 'spending' ? 'Monthly spend' : mode === 'monthly' ? 'MoM rates' : 'Price indices'}</button>)}</div>
      <div className="mt-3 h-[260px] min-w-0 rounded-xl bg-[#081f28] p-2"><ChartContainer className="h-full w-full aspect-auto" config={chartConfig}><AreaChart data={rows} onClick={(state) => { const label = String(state?.activeLabel ?? ''); if (rows.some((row) => row.month === label)) setSelectedMonth(label); }} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} /><XAxis dataKey="month" interval="preserveStartEnd" tick={{ fill: '#a9bcc1', fontSize: 12 }} tickFormatter={(value) => String(value).slice(2)} /><YAxis tick={{ fill: '#a9bcc1', fontSize: 12 }} tickFormatter={(value) => chartMode === 'spending' ? `$${value}M` : `${value}%`} width={60} /><ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span className="flex w-full justify-between gap-4 text-xs"><span>{chartConfig[String(name) as keyof typeof chartConfig]?.label ?? String(name)}</span><b>{Number(value).toFixed(chartMode === 'spending' ? 2 : 3)}</b></span>} />} />
        {chartKeys.map((key, i) => <Area dataKey={key} fill={i === chartKeys.length - 1 ? '#61cfc1' : 'transparent'} fillOpacity={0.12} key={key} stroke={`var(--color-${key})`} strokeWidth={i === chartKeys.length - 1 ? 3 : 1.5} type="stepAfter" />)}<ReferenceLine stroke="#f3f7f6" strokeDasharray="4 4" x={month.month} />
      </AreaChart></ChartContainer></div>
      <p className="mt-2 text-xs text-[#a9bcc1]">Monthly scenario rates are held constant within each annual scenario period, shifted by the assumed lag—not observed monthly activity. Low/high paths are sensitivity cases, not confidence intervals.</p>
      <label className="mt-4 block text-sm"><span className="flex justify-between"><strong>Selected month · {month.month}</strong><span>{selectedIndex + 1} / {rows.length}</span></span><input aria-label="Selected project month" aria-valuetext={month.month} className="scenario-range mt-3 w-full" max={rows.length - 1} min={0} onChange={(event) => setSelectedMonth(rows[Number(event.target.value)].month)} type="range" value={selectedIndex} /></label>
      <div className="mt-3 grid gap-2 sm:grid-cols-2"><Readout label="Base spend this month" value={money(month.baseSpend)} /><Readout label="AI scenario dollars this month" value={money(month.aiIncrement)} /><Readout label="Scenario spend this month" value={money(month.combinedSpend)} /><Readout label="Combined MoM this month" value={month.combined_mom_pct === null ? '—' : `${month.combined_mom_pct.toFixed(3)}%`} /></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{(['primary', 'secondary'] as const).map((tier) => <div key={tier}><h3 className="text-sm font-medium">{tier === 'primary' ? 'Primary drivers' : 'Secondary effects'} · {month.month}</h3><div className="mt-2 flex flex-wrap gap-2">{drivers.filter((row) => row.tier === tier).map((row) => <button aria-pressed={driver?.driver_id === row.driver_id} className={`rounded-lg border px-3 py-2 text-left text-xs ${driver?.driver_id === row.driver_id ? 'border-[#ef9664] bg-[#ef9664]/10 text-[#ffd0b4]' : 'border-white/15 text-[#c5d7db]'}`} key={row.driver_id} onClick={() => setSelectedDriver(row.driver_id)} type="button">{row.label}<span className="block font-mono">{row.contribution_pct_points === null ? 'Not allocated' : `${row.contribution_pct_points.toFixed(4)} pp MoM`}</span></button>)}</div></div>)}</div>
      <p className="mt-3 text-xs text-[#a9bcc1]">Driver allocation assumes 82% primary / 18% secondary; graph weights split the primary share. This explains the scenario, not measured causation. No observed market index is added again to the assumed baseline.</p>
    </section>
    <section className="flex min-w-0 flex-col gap-4"><NodalPanel calibration={active} driver={driver} month={month.month} /><MitigationPanel calibration={active} driver={driver} month={month.month} selected={selectedMitigations} setSelected={setSelectedMitigations} /></section>
  </div>;
}

function AssumptionControls({ assumptions, onChange }: { assumptions: PlanningAssumptions; onChange: (value: PlanningAssumptions) => void }) {
  const controls: Array<[keyof PlanningAssumptions, string, number, number, number, string]> = [['annualBaselinePct', 'Baseline', 0, 12, .1, '%/yr'], ['peakAiAnnualPctPoints', 'AI peak', 0, 8, .05, 'pp/yr'], ['localCapturePct', 'Local capture', 0, 80, 1, '%'], ['lagMonths', 'Lag', 0, 24, 1, 'mo'], ['uncertaintyPct', 'AI sensitivity', 0, 100, 5, '±%']];
  return <details className="mt-3 rounded-xl border border-white/10 bg-[#081f28] p-3"><summary className="cursor-pointer text-sm">Scenario assumptions · baseline {assumptions.annualBaselinePct}%/yr · AI peak {assumptions.peakAiAnnualPctPoints} pp/yr</summary><div className="mt-3 grid gap-4 sm:grid-cols-3">{controls.map(([key, label, min, max, step, unit]) => <label className="block text-xs" key={key}><span className="flex justify-between gap-2"><span>{label}</span><b>{assumptions[key]} {unit}</b></span><input aria-label={label} className="scenario-range mt-2 w-full" max={max} min={min} onChange={(event) => onChange({ ...assumptions, [key]: Number(event.target.value) })} step={step} type="range" value={assumptions[key]} /></label>)}</div></details>;
}

type Driver = MonthlyEscalationCalibration['drivers'][number] | undefined;
function NodalPanel({ calibration, driver, month }: { calibration: MonthlyEscalationCalibration; driver: Driver; month: string }) {
  const nodes = driver?.node_ids.map((id) => calibration.nodes.find((node) => node.node_id === id)).filter((node) => node !== undefined) ?? [];
  return <div className="rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><h3 className="text-sm text-[#72cfc3]">Driver path · {month}</h3><div className="mt-5 flex items-center gap-2">{nodes.slice(0, 3).map((node, i) => <div className="contents" key={node.node_id}>{i > 0 ? <ArrowRight className="size-4 shrink-0 text-[#ef9664]" /> : null}<div className="flex min-h-24 min-w-0 flex-1 items-center justify-center rounded-2xl border border-[#61cfc1]/30 bg-[#081f28] p-2 text-center text-xs">{node.label}</div></div>)}</div><p className="mt-4 text-sm">{driver?.label ?? 'Select a driver'}</p><p className="mt-1 font-mono text-[#ffd0b4]">{driver?.contribution_pct_points == null ? 'Monthly allocation unavailable' : `${driver.contribution_pct_points.toFixed(4)} pp MoM (assumed)`}</p><p className="mt-2 text-xs text-[#a9bcc1]">Path structure is illustrative; upstream arrows do not add another cost contribution.</p></div>;
}

function MitigationPanel({ calibration, driver, month, selected, setSelected }: { calibration: MonthlyEscalationCalibration; driver: Driver; month: string; selected: string[]; setSelected: (value: string[]) => void }) {
  const rows = calibration.mitigations.filter((item) => item.driver_id === driver?.driver_id);
  const owners = { now: 'Project sponsor', design: 'Design lead', procurement: 'Procurement lead', delivery: 'Construction manager' };
  return <div className="rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><h3 className="text-sm text-[#72cfc3]">Decision response · {month}</h3><p className="mt-3 text-lg">{driver?.label ?? 'Select a driver'}</p><p className="mt-1 text-xs text-[#a9bcc1]">Consider before exposure in this month. Timing and owners are suggested, not assigned.</p><div className="mt-4 grid gap-3">{rows.length ? rows.map((item) => { const key = `${driver?.driver_id}:${item.label}`; const checked = selected.includes(key); return <button aria-pressed={checked} className={`rounded-xl border p-3 text-left ${checked ? 'border-[#61cfc1] bg-[#61cfc1]/10' : 'border-white/15 bg-[#081f28]'}`} key={key} onClick={() => setSelected(checked ? selected.filter((value) => value !== key) : [...selected, key])} type="button"><span className="block text-sm">{checked ? '✓ ' : ''}{item.label}</span><span className="mt-2 block text-xs text-[#a9bcc1]">{item.timing} · {owners[item.timing]}</span><span className="mt-1 block text-xs text-[#a9bcc1]">Evidence needed: supplier capacity/lead-time confirmation and a costed feasibility review.</span></button>; }) : <p className="text-sm text-[#a9bcc1]">No reviewed strategy mapped to this secondary effect. Escalate to the project risk review.</p>}</div><p className="mt-4 flex items-center gap-2 text-xs text-[#efb18d]"><CircleAlert className="size-4 shrink-0" />{selected.length} actions selected in this session · no savings credited.</p></div>;
}
function Readout({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-[#081f28] p-3"><p className="font-mono text-xl text-[#a9eee4]">{value}</p><p className="mt-2 text-xs text-[#b7cbd0]">{label}</p></div>; }
function money(value: number | null | undefined) { return value == null ? '—' : `$${value.toFixed(2)}M`; }
