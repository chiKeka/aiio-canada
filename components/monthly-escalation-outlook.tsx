'use client';

import { useMemo, useState } from 'react';
import { Activity, ArrowRight, CircleAlert, ShieldCheck } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

export type MonthlyEscalationCalibration = {
  schema_version: '1.0.0';
  calibration_id: string;
  status: 'awaiting_calibration' | 'calibrated' | 'superseded';
  as_of_date: string | null;
  geography_id: string;
  model_version: string | null;
  monthly_series: Array<{
    month: string;
    baseline_mom_pct: number | null;
    ai_increment_mom_pct: number | null;
    combined_mom_pct: number | null;
    lower_bound_pct: number | null;
    upper_bound_pct: number | null;
  }>;
  drivers: Array<{
    driver_id: string;
    label: string;
    tier: 'primary' | 'secondary';
    contribution_pct_points: number | null;
    peak_month: string | null;
    confidence: 'low' | 'medium' | 'high' | null;
    node_ids: string[];
  }>;
  nodes: Array<{ node_id: string; label: string; layer: string; pressure_score: number | null }>;
  edges: Array<{ source: string; target: string; contribution_pct_points: number | null }>;
  mitigations: Array<{ driver_id: string; label: string; timing: 'now' | 'design' | 'procurement' | 'delivery'; evidence_status: string }>;
  expected_driver_slots: Array<{ driver_id: string; label: string; tier: 'primary' | 'secondary' }>;
  publication_boundary: {
    monthly_ai_increment_authorized: boolean;
    combined_project_escalation_authorized: boolean;
    driver_contribution_authorized: boolean;
    note: string;
  };
};

const chartConfig = {
  baseline_mom_pct: { label: 'Baseline', color: '#75aebe' },
  ai_increment_mom_pct: { label: 'Data-centre increment', color: '#ef9664' },
  combined_mom_pct: { label: 'Combined', color: '#61cfc1' },
} satisfies ChartConfig;

export function MonthlyEscalationOutlook({ calibration, projectStart, durationYears }: {
  calibration: MonthlyEscalationCalibration;
  projectStart: number;
  durationYears: number;
}) {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const isCalibrated = calibration.status === 'calibrated' && calibration.publication_boundary.monthly_ai_increment_authorized;
  const chartRows = useMemo(() => isCalibrated ? calibration.monthly_series : buildPendingMonths(projectStart, durationYears), [calibration.monthly_series, durationYears, isCalibrated, projectStart]);
  const driverRows = calibration.drivers.length ? calibration.drivers : calibration.expected_driver_slots.map((driver) => ({ ...driver, contribution_pct_points: null, peak_month: null, confidence: null, node_ids: [] }));
  const activeDriver = driverRows.find((driver) => driver.driver_id === selectedDriver) ?? driverRows[0];
  const primary = driverRows.filter((driver) => driver.tier === 'primary');
  const secondary = driverRows.filter((driver) => driver.tier === 'secondary');

  return <div className="grid h-full min-h-[620px] gap-4 xl:min-h-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
    <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#72cfc3]">Monthly exposure</p><h2 className="mt-1 text-2xl font-medium tracking-[-0.035em]">Escalation path</h2></div>
        <span className={`rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em] ${isCalibrated ? 'border-[#61cfc1]/35 bg-[#61cfc1]/10 text-[#a9eee4]' : 'border-[#ef9664]/35 bg-[#ef9664]/10 text-[#ffc6a3]'}`}>{isCalibrated ? `calibrated · ${calibration.as_of_date}` : 'awaiting calibration'}</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Metric label="Baseline MoM" value={latest(chartRows, 'baseline_mom_pct')} tone="blue" />
        <Metric label="Data-centre increment" value={isCalibrated ? latest(chartRows, 'ai_increment_mom_pct') : null} tone="orange" />
        <Metric label="Combined MoM" value={isCalibrated && calibration.publication_boundary.combined_project_escalation_authorized ? latest(chartRows, 'combined_mom_pct') : null} tone="teal" />
      </div>
      <div className="relative mt-4 min-h-[250px] flex-1 overflow-hidden rounded-2xl border border-white/8 bg-[#081f28] p-3">
        <ChartContainer className="h-full min-h-[250px] w-full aspect-auto" config={chartConfig}>
          <AreaChart data={chartRows} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
            <defs><linearGradient id="combinedFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#61cfc1" stopOpacity={0.28} /><stop offset="100%" stopColor="#61cfc1" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
            <XAxis axisLine={false} dataKey="month" interval="preserveStartEnd" tick={{ fill: '#78949a', fontSize: 9 }} tickLine={false} tickFormatter={(value) => String(value).slice(2, 7)} />
            <YAxis axisLine={false} tick={{ fill: '#78949a', fontSize: 9 }} tickFormatter={(value) => `${value}%`} tickLine={false} width={34} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="baseline_mom_pct" fill="transparent" stroke="var(--color-baseline_mom_pct)" strokeWidth={2} type="monotone" />
            <Area dataKey="ai_increment_mom_pct" fill="transparent" stroke="var(--color-ai_increment_mom_pct)" strokeDasharray="5 4" strokeWidth={2} type="monotone" />
            <Area dataKey="combined_mom_pct" fill="url(#combinedFill)" stroke="var(--color-combined_mom_pct)" strokeWidth={3} type="monotone" />
          </AreaChart>
        </ChartContainer>
        {!isCalibrated ? <div className="absolute inset-0 grid place-items-center bg-[#081f28]/72 backdrop-blur-[1px]"><div className="text-center"><Activity className="mx-auto size-8 text-[#72cfc3]" /><p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-[#dff7f1]">Monthly series ready</p><p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#78949a]">Values populate after calibration</p></div></div> : null}
      </div>
      <DriverBands primary={primary} secondary={secondary} selectedDriver={activeDriver?.driver_id ?? null} setSelectedDriver={setSelectedDriver} />
    </section>

    <section className="grid min-h-0 gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:grid-rows-[1fr_1fr]">
      <NodalPanel calibration={calibration} driver={activeDriver} isCalibrated={isCalibrated} />
      <MitigationPanel calibration={calibration} driver={activeDriver} />
    </section>
  </div>;
}

function DriverBands({ primary, secondary, selectedDriver, setSelectedDriver }: { primary: MonthlyEscalationCalibration['drivers']; secondary: MonthlyEscalationCalibration['drivers']; selectedDriver: string | null; setSelectedDriver: (id: string) => void }) {
  return <div className="mt-4 grid gap-3 md:grid-cols-2"><DriverGroup label="Primary drivers" rows={primary} selectedDriver={selectedDriver} setSelectedDriver={setSelectedDriver} tone="orange" /><DriverGroup label="Secondary effects" rows={secondary} selectedDriver={selectedDriver} setSelectedDriver={setSelectedDriver} tone="blue" /></div>;
}

function DriverGroup({ label, rows, selectedDriver, setSelectedDriver, tone }: { label: string; rows: MonthlyEscalationCalibration['drivers']; selectedDriver: string | null; setSelectedDriver: (id: string) => void; tone: 'orange' | 'blue' }) {
  return <div><p className="mb-2 text-[8px] uppercase tracking-[0.14em] text-[#78949a]">{label}</p><div className="flex flex-wrap gap-1.5">{rows.map((row) => <button className={`rounded-full border px-2.5 py-1.5 text-[9px] transition ${selectedDriver === row.driver_id ? tone === 'orange' ? 'border-[#ef9664] bg-[#ef9664]/18 text-[#ffd0b4]' : 'border-[#75aebe] bg-[#75aebe]/18 text-[#cae7ed]' : 'border-white/10 bg-white/4 text-[#91a8ad] hover:text-white'}`} key={row.driver_id} onClick={() => setSelectedDriver(row.driver_id)} type="button">{row.label}{row.contribution_pct_points === null ? '' : ` · ${signed(row.contribution_pct_points)}pp`}</button>)}</div></div>;
}

function NodalPanel({ calibration, driver, isCalibrated }: { calibration: MonthlyEscalationCalibration; driver: MonthlyEscalationCalibration['drivers'][number] | undefined; isCalibrated: boolean }) {
  const related = calibration.nodes.filter((node) => driver?.node_ids.includes(node.node_id));
  const nodes = related.length ? related : [{ node_id: 'shock', label: 'AI build-out', layer: 'shock', pressure_score: null }, { node_id: 'driver', label: driver?.label ?? 'Driver', layer: 'constraint', pressure_score: null }, { node_id: 'cost', label: 'Project cost', layer: 'outcome', pressure_score: null }];
  return <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><div className="flex items-center justify-between"><p className="text-[9px] uppercase tracking-[0.14em] text-[#72cfc3]">Nodal relationship</p><span className="font-mono text-[9px] text-[#78949a]">{isCalibrated ? `${calibration.edges.length} edges` : 'pending weights'}</span></div><div className="mt-5 flex flex-1 items-center justify-between gap-2">{nodes.slice(0, 3).map((node, index) => <div className="contents" key={node.node_id}>{index > 0 ? <ArrowRight className="size-4 shrink-0 text-[#ef9664]" /> : null}<div className="grid min-h-28 min-w-0 flex-1 place-items-center rounded-full border border-[#61cfc1]/25 bg-[#081f28] p-3 text-center"><div><p className="text-[8px] uppercase tracking-[0.12em] text-[#78949a]">{node.layer}</p><p className="mt-2 text-[10px] font-medium leading-4 text-[#dff7f1]">{node.label}</p><p className="mt-1 font-mono text-[9px] text-[#72cfc3]">{node.pressure_score === null ? '—' : node.pressure_score.toFixed(2)}</p></div></div></div>)}</div></div>;
}

function MitigationPanel({ calibration, driver }: { calibration: MonthlyEscalationCalibration; driver: MonthlyEscalationCalibration['drivers'][number] | undefined }) {
  const matched = calibration.mitigations.filter((item) => item.driver_id === driver?.driver_id);
  const placeholders = ['Early market test', 'Package strategy', 'Lead-time lock'];
  return <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><div className="flex items-center justify-between"><p className="text-[9px] uppercase tracking-[0.14em] text-[#72cfc3]">Mitigation</p><ShieldCheck className="size-4 text-[#72cfc3]" /></div><p className="mt-3 text-lg font-medium">{driver?.label ?? 'Select a driver'}</p><div className="mt-4 grid gap-2">{(matched.length ? matched : placeholders.map((label) => ({ label, timing: 'pending', evidence_status: 'mapping pending' }))).map((item) => <div className="flex items-center justify-between rounded-xl border border-white/8 bg-[#081f28] px-3 py-2.5" key={item.label}><span className="text-[10px] text-[#d1dfe1]">{item.label}</span><span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#78949a]">{item.timing}</span></div>)}</div><div className="mt-auto flex items-center gap-2 pt-4 text-[8px] uppercase tracking-[0.1em] text-[#efb18d]"><CircleAlert className="size-3" /> Strategy mapping requires review</div></div>;
}

function Metric({ label, tone, value }: { label: string; tone: 'blue' | 'orange' | 'teal'; value: number | null }) { const color = tone === 'orange' ? 'text-[#ffb184]' : tone === 'blue' ? 'text-[#abd2da]' : 'text-[#a9eee4]'; return <div className="rounded-xl border border-white/8 bg-[#081f28] p-3"><p className={`font-mono text-xl ${color}`}>{value === null ? '—' : signed(value)}</p><p className="mt-2 text-[8px] uppercase tracking-[0.1em] text-[#78949a]">{label}</p></div>; }
function latest(rows: MonthlyEscalationCalibration['monthly_series'], key: 'baseline_mom_pct' | 'ai_increment_mom_pct' | 'combined_mom_pct') { return rows.at(-1)?.[key] ?? null; }
function signed(value: number) { return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`; }
function buildPendingMonths(startYear: number, durationYears: number): MonthlyEscalationCalibration['monthly_series'] { const count = Math.min(60, durationYears * 12); return Array.from({ length: count }, (_, index) => { const date = new Date(Date.UTC(startYear, index, 1)); return { month: date.toISOString().slice(0, 7), baseline_mom_pct: null, ai_increment_mom_pct: null, combined_mom_pct: null, lower_bound_pct: null, upper_bound_pct: null }; }); }
