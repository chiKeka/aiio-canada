'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Factory,
  Gauge,
  Layers3,
  Route,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { MonthlyEscalationOutlook, type MonthlyEscalationCalibration } from '@/components/monthly-escalation-outlook';
import { ASSETS, buildDecisionAnalysis, METROS, type AssetId, type MetroId } from '@/lib/decision-analysis';
import monthlyCalibration from '@/data/model-runs/executive_monthly_escalation_current.json';
import releaseData from '@/public/data/latest.json';

type View = 'outlook' | 'cockpit' | 'walkthrough' | 'evidence';

const views: { id: View; label: string; icon: typeof Gauge }[] = [
  { id: 'outlook', label: 'Monthly outlook', icon: Activity },
  { id: 'cockpit', label: 'Decision cockpit', icon: Gauge },
  { id: 'walkthrough', label: 'Guided story', icon: Route },
  { id: 'evidence', label: 'Evidence lens', icon: Layers3 },
];

const tour = [
  {
    kicker: '01 · Define',
    title: 'Shape the decision.',
    body: 'Asset · market · value · window',
    visual: 'project',
  },
  {
    kicker: '02 · Observe',
    title: 'Scan four signals.',
    body: 'Materials · labour · delivery · power',
    visual: 'signals',
  },
  {
    kicker: '03 · Trace',
    title: 'Trace the mechanism.',
    body: 'Investment → constraints → project exposure',
    visual: 'graph',
  },
  {
    kicker: '04 · Decide',
    title: 'Act on gates.',
    body: 'Test market · coordinate utilities · refresh estimate',
    visual: 'decision',
  },
] as const;

export function ExecutiveCockpit() {
  const [view, setView] = useState<View>('outlook');
  const [tourStep, setTourStep] = useState(0);
  const [assetId, setAssetId] = useState<AssetId>('hospital');
  const [metroId, setMetroId] = useState<MetroId>('CMA_835');
  const [budgetMillions, setBudgetMillions] = useState(1200);
  const [startYear, setStartYear] = useState(2029);
  const [duration, setDuration] = useState(5);
  const analysis = useMemo(
    () => buildDecisionAnalysis({ assetId, duration, metroId, startYear }),
    [assetId, duration, metroId, startYear],
  );

  const completeLabour = analysis.labourRows
    .filter((row) => row.vacancies_per_1_000_2021_employed !== null)
    .sort((a, b) => (b.vacancies_per_1_000_2021_employed ?? 0) - (a.vacancies_per_1_000_2021_employed ?? 0));
  const leadingMaterial = analysis.materials[0];
  const requestedGw = analysis.powerEvidence.requested_load.latest_requested_load_mw / 1000;

  return (
    <main className="min-h-screen bg-[#071c25] text-white">
      <SiteHeader />
      <section className="relative min-h-[calc(100dvh-68px)] overflow-hidden">
        <div className="cockpit-aurora absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-[1520px] flex-col px-4 py-4 sm:px-6 lg:h-[calc(100dvh-68px)] lg:px-8 lg:py-5">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <Badge className="border-[#54c9bb]/35 bg-[#54c9bb]/12 text-[#8be0d3]">Alberta pilot</Badge>
              <div>
                <p className="text-lg font-medium tracking-[-0.025em]">Executive cockpit</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8ea7ad]">{releaseData.manifest.version} · evidence first</p>
              </div>
            </div>
            <nav className="flex w-full gap-1 rounded-xl border border-white/10 bg-black/20 p-1 xl:w-auto" aria-label="Executive dashboard views">
              {views.map(({ id, label, icon: Icon }) => (
                <button
                  className={`flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition ${view === id ? 'bg-[#dff7f1] text-[#113b3b]' : 'text-[#a8bcc1] hover:bg-white/7 hover:text-white'}`}
                  key={id}
                  onClick={() => setView(id)}
                  type="button"
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </nav>
          </header>

          <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-white/10 bg-[#0d2933]/88 p-4 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between">
                <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#72cfc3]">Project</p><h1 className="mt-1 text-base font-medium">Shape the decision</h1></div>
                <Building2 className="size-5 text-[#72cfc3]" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Control label="Asset class"><NativeSelect className="w-full [&>select]:h-9 [&>select]:border-white/10 [&>select]:bg-white/6 [&>select]:text-white" onChange={(e) => setAssetId(e.target.value as AssetId)} value={assetId}>{Object.entries(ASSETS).map(([id, asset]) => <NativeSelectOption key={id} value={id}>{asset.label}</NativeSelectOption>)}</NativeSelect></Control>
                <Control label="Market"><NativeSelect className="w-full [&>select]:h-9 [&>select]:border-white/10 [&>select]:bg-white/6 [&>select]:text-white" onChange={(e) => setMetroId(e.target.value as MetroId)} value={metroId}>{Object.entries(METROS).map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect></Control>
                <div className="grid grid-cols-2 gap-2">
                  <Control label="Estimate ($M)"><Input className="h-9 border-white/10 bg-white/6 font-mono text-white" min="1" onChange={(e) => setBudgetMillions(Math.max(1, Number(e.target.value) || 1))} type="number" value={budgetMillions} /></Control>
                  <Control label="Start"><Input className="h-9 border-white/10 bg-white/6 font-mono text-white" max="2040" min="2026" onChange={(e) => setStartYear(Number(e.target.value) || 2026)} type="number" value={startYear} /></Control>
                </div>
                <Control label={`Delivery window · ${duration} years`}><input aria-label="Delivery duration" className="scenario-range mt-2 w-full" max="10" min="2" onChange={(e) => setDuration(Number(e.target.value))} type="range" value={duration} /></Control>
              </div>
              <div className="mt-4 rounded-xl border border-[#ee9665]/30 bg-[#ee9665]/10 p-3">
                <div className="flex items-center gap-2"><CircleAlert className="size-4 shrink-0 text-[#ffab78]" /><p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#efc4aa]">AI cost + delay unquantified</p></div>
              </div>
            </aside>

            <div className="min-h-0">
              {view === 'outlook' ? (
                <MonthlyEscalationOutlook assetOutcome={analysis.asset.outcome} calibration={monthlyCalibration as MonthlyEscalationCalibration} durationYears={duration} projectStart={startYear} />
              ) : view === 'cockpit' ? (
                <CockpitView analysis={analysis} budgetMillions={budgetMillions} completeLabour={completeLabour} leadingMaterial={leadingMaterial} requestedGw={requestedGw} />
              ) : view === 'walkthrough' ? (
                <Walkthrough analysis={analysis} budgetMillions={budgetMillions} setTourStep={setTourStep} tourStep={tourStep} />
              ) : (
                <EvidenceView analysis={analysis} completeLabour={completeLabour} requestedGw={requestedGw} />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CockpitView({ analysis, budgetMillions, completeLabour, leadingMaterial, requestedGw }: {
  analysis: ReturnType<typeof buildDecisionAnalysis>;
  budgetMillions: number;
  completeLabour: ReturnType<typeof buildDecisionAnalysis>['labourRows'];
  leadingMaterial: ReturnType<typeof buildDecisionAnalysis>['materials'][number] | undefined;
  requestedGw: number;
}) {
  return <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
    <section className="flex min-h-[570px] flex-col rounded-2xl border border-white/10 bg-[#0d2933]/88 p-5 shadow-2xl shadow-black/20 backdrop-blur lg:min-h-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-[9px] uppercase tracking-[0.16em] text-[#72cfc3]">Live map</p><h2 className="mt-1 text-2xl font-medium tracking-[-0.035em]">Impact path</h2></div>
        <div className="text-right"><p className="font-mono text-xl text-[#dff7f1]">${budgetMillions.toLocaleString()}M</p><p className="text-[9px] uppercase tracking-[0.1em] text-[#8fa8ae]">{analysis.asset.label}</p></div>
      </div>
      <ImpactMap analysis={analysis} />
      <div className="mt-auto grid gap-2 sm:grid-cols-4">
        <SignalTile icon={Factory} label="Leading material" value={leadingMaterial ? signed(leadingMaterial.year_over_year_percent_change) : 'n/a'} note="YoY observed" />
        <SignalTile icon={Users} label="Leading labour" value={completeLabour[0]?.vacancies_per_1_000_2021_employed?.toFixed(1) ?? 'n/a'} note="vacancies / 1k" />
        <SignalTile icon={Zap} label="Requested load" value={`${requestedGw.toFixed(1)} GW`} note="not connected load" />
        <SignalTile icon={Building2} label="Concurrent screen" value={String(analysis.concurrentProjectCount)} note="same-class records" />
      </div>
    </section>
    <section className="grid min-h-0 gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:grid-rows-[auto_1fr_auto]">
      <div className="rounded-2xl border border-[#62cdbf]/25 bg-[#123840] p-5">
        <div className="flex items-center justify-between"><p className="text-[9px] uppercase tracking-[0.14em] text-[#80d7cc]">Executive readout</p><Sparkles className="size-4 text-[#80d7cc]" /></div>
        <p className="mt-4 text-3xl font-medium leading-none tracking-[-0.04em]">Gated diligence.</p>
        <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-[#a9bec2]"><Check className="size-3.5 text-[#70d3c5]" /> No blanket AI premium</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#0d2933]/88 p-5">
        <p className="text-[9px] uppercase tracking-[0.14em] text-[#8fa8ae]">Delivery window</p>
        <Timeline start={analysis.scenarioWindowStart} end={analysis.scenarioWindowEnd} projectStart={analysis.endYear - analysis.scenarioWindowYears.length + 1} projectEnd={analysis.endYear} intersection={analysis.scenarioWindowYears} />
        <p className="mt-4 font-mono text-xs text-[#a8bcc1]">{analysis.scenarioWindowYears.length} intersecting years</p>
      </div>
      <Link className="group flex items-center justify-between rounded-2xl border border-[#ef9664]/30 bg-[#ef9664]/10 p-4 text-sm text-[#ffd0b4] transition hover:bg-[#ef9664]/15" href="/research"><span>Method + audit</span><ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>
    </section>
  </div>;
}

function ImpactMap({ analysis }: { analysis: ReturnType<typeof buildDecisionAnalysis> }) {
  const trade = analysis.dominantNode?.label ?? 'Priority trade pathway';
  return <div className="relative my-5 flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-[#081f28] p-4">
    <div className="cockpit-orbit absolute size-[420px] rounded-full border border-[#4fc5b6]/12" aria-hidden="true" />
    <div className="cockpit-orbit absolute size-[300px] rounded-full border border-[#4fc5b6]/16" aria-hidden="true" />
    <div className="relative grid w-full max-w-3xl grid-cols-[1fr_36px_1fr_36px_1fr] items-center gap-1 text-center">
      <MapNode eyebrow="Shock" icon={Factory} title="$50B scenario" tone="teal" />
      <FlowLine />
      <MapNode eyebrow="Constraint" icon={Users} title={trade} tone="blue" />
      <FlowLine />
      <MapNode eyebrow="Exposure" icon={Building2} title={analysis.asset.label} tone="orange" />
    </div>
    <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[8px] uppercase tracking-[0.12em] text-[#78949a]"><span>Assumed path</span><span>Inspectable · low confidence</span><span>Not a forecast</span></div>
  </div>;
}

function Walkthrough({ analysis, budgetMillions, setTourStep, tourStep }: { analysis: ReturnType<typeof buildDecisionAnalysis>; budgetMillions: number; setTourStep: (value: number) => void; tourStep: number }) {
  const step = tour[tourStep];
  return <section className="flex h-full min-h-[610px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d2933]/92 shadow-2xl shadow-black/20 lg:min-h-0">
    <div className="grid grid-cols-4 border-b border-white/10 bg-black/15">
      {tour.map((item, index) => <button className={`relative px-2 py-4 text-left transition ${index === tourStep ? 'bg-white/6 text-white' : 'text-[#779198] hover:text-white'}`} key={item.kicker} onClick={() => setTourStep(index)} type="button"><span className="block text-[9px] uppercase tracking-[0.12em]">{item.kicker}</span>{index === tourStep ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#62d2c4]" /> : null}</button>)}
    </div>
    <div className="grid min-h-0 flex-1 lg:grid-cols-[.8fr_1.2fr]">
      <div className="flex flex-col justify-center border-b border-white/10 p-7 lg:border-b-0 lg:border-r">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#72cfc3]">{step.kicker}</p>
        <h2 className="mt-4 text-4xl font-medium leading-[1.05] tracking-[-0.045em]">{step.title}</h2>
        <p className="mt-5 font-mono text-xs uppercase tracking-[0.1em] text-[#a9bcc1]">{step.body}</p>
        <div className="mt-8 flex gap-2"><Button className="border border-white/10 bg-white/5 text-white hover:bg-white/10" disabled={tourStep === 0} onClick={() => setTourStep(Math.max(0, tourStep - 1))}><ChevronLeft /> Back</Button><Button className="bg-[#dff7f1] text-[#113b3b] hover:bg-white" disabled={tourStep === tour.length - 1} onClick={() => setTourStep(Math.min(tour.length - 1, tourStep + 1))}>Next <ChevronRight /></Button></div>
      </div>
      <TourVisual analysis={analysis} budgetMillions={budgetMillions} kind={step.visual} />
    </div>
  </section>;
}

function TourVisual({ analysis, budgetMillions, kind }: { analysis: ReturnType<typeof buildDecisionAnalysis>; budgetMillions: number; kind: typeof tour[number]['visual'] }) {
  if (kind === 'graph') return <div className="flex min-h-[360px] items-center p-6"><ImpactMap analysis={analysis} /></div>;
  if (kind === 'signals') return <div className="grid content-center gap-3 p-6 sm:grid-cols-2">{analysis.materials.slice(0, 4).map((row) => <div className="rounded-2xl border border-white/10 bg-[#081f28] p-5" key={row.indicator_id}><div className="flex items-center justify-between"><Factory className="size-4 text-[#72cfc3]" /><span className="font-mono text-xl text-[#dff7f1]">{signed(row.year_over_year_percent_change)}</span></div><p className="mt-7 text-xs text-[#a9bcc1]">{row.component.replaceAll('_', ' ')}</p><Bar value={Math.abs(row.year_over_year_percent_change)} /></div>)}</div>;
  if (kind === 'decision') return <div className="flex items-center justify-center p-8"><div className="relative grid size-72 place-items-center rounded-full border border-[#6ad6c8]/25 bg-[#0a222b]"><div className="absolute inset-5 rounded-full border border-dashed border-[#6ad6c8]/25" /><div className="relative max-w-[190px] text-center"><CircleAlert className="mx-auto size-7 text-[#ff9d66]" /><p className="mt-4 text-2xl font-medium">AI premium withheld</p><p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#a9bcc1]">4 diligence gates</p></div></div></div>;
  return <div className="flex items-center justify-center p-8"><div className="grid w-full max-w-lg gap-3 sm:grid-cols-2"><BigNumber label="Capital decision" value={`$${budgetMillions.toLocaleString()}M`} /><BigNumber label="Delivery" value={`${analysis.endYear - (analysis.endYear - analysis.scenarioWindowYears.length + 1) + 1 || 0} yrs`} /><BigNumber label="Region" value={METROS[analysis.metroId].replace(' region', '')} /><BigNumber label="Asset" value={analysis.asset.label.split(' or ')[0]} /></div></div>;
}

function EvidenceView({ analysis, completeLabour, requestedGw }: { analysis: ReturnType<typeof buildDecisionAnalysis>; completeLabour: ReturnType<typeof buildDecisionAnalysis>['labourRows']; requestedGw: number }) {
  const channels = [
    { icon: Factory, label: 'Materials', value: analysis.materials[0] ? signed(analysis.materials[0].year_over_year_percent_change) : 'n/a', note: 'leading observed component change' },
    { icon: Users, label: 'Labour', value: completeLabour[0]?.vacancies_per_1_000_2021_employed?.toFixed(1) ?? 'n/a', note: 'vacancies per 1,000 employed' },
    { icon: Building2, label: 'Public delivery', value: String(analysis.concurrentProjectCount), note: 'concurrent complete schedules' },
    { icon: Zap, label: 'Power', value: `${requestedGw.toFixed(1)} GW`, note: 'requested—not connected—load' },
  ];
  return <section className="grid h-full min-h-[610px] gap-4 lg:min-h-0 lg:grid-cols-[1.1fr_.9fr]">
    <div className="rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><p className="text-[9px] uppercase tracking-[0.15em] text-[#72cfc3]">Evidence lens</p><h2 className="mt-2 text-2xl font-medium">Four signals. No forced composite.</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{channels.map(({ icon: Icon, label, note, value }) => <article className="rounded-2xl border border-white/10 bg-[#081f28] p-5" key={label} title={note}><div className="flex items-center justify-between"><Icon className="size-5 text-[#72cfc3]" /><span className="font-mono text-3xl text-[#dff7f1]">{value}</span></div><p className="mt-8 text-[10px] font-medium uppercase tracking-[0.1em] text-[#a9bcc1]">{label}</p></article>)}</div></div>
    <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><p className="text-[9px] uppercase tracking-[0.15em] text-[#72cfc3]">Evidence maturity</p><div className="mt-5 space-y-5"><Maturity label="Observed market" value={92} tone="teal" /><Maturity label="Historical analog" value={72} tone="blue" /><Maturity label="Graph mechanism" value={38} tone="amber" /><Maturity label="AI effect" value={4} tone="orange" /></div><div className="mt-auto rounded-xl border border-[#ff9d66]/25 bg-[#ff9d66]/8 p-4 font-mono text-[9px] uppercase tracking-[0.1em] text-[#efc4aa]">Maturity · not probability</div></div>
  </section>;
}

function Control({ children, label }: { children: React.ReactNode; label: string }) { return <label className="block"><span className="mb-1.5 block text-[9px] uppercase tracking-[0.1em] text-[#8fa8ae]">{label}</span>{children}</label>; }
function FlowLine() { return <div className="relative h-px bg-gradient-to-r from-[#58cbbd] to-[#ef9664]"><ArrowRight className="absolute -right-1.5 -top-2 size-4 text-[#ef9664]" /></div>; }
function MapNode({ eyebrow, icon: Icon, title, tone }: { eyebrow: string; icon: typeof Factory; title: string; tone: 'teal' | 'blue' | 'orange' }) { const styles = tone === 'orange' ? 'border-[#ee9665]/40 bg-[#ee9665]/12 text-[#ffc6a3]' : tone === 'blue' ? 'border-[#75aebe]/35 bg-[#75aebe]/10 text-[#b9e0e8]' : 'border-[#58cbbd]/40 bg-[#58cbbd]/10 text-[#a9eee4]'; return <div className={`relative z-10 flex min-h-36 flex-col items-center justify-center rounded-full border p-3 shadow-xl shadow-black/20 ${styles}`}><Icon className="size-5" /><p className="mt-3 text-[8px] uppercase tracking-[0.14em] opacity-70">{eyebrow}</p><p className="mt-1 max-w-28 text-xs font-medium leading-4">{title}</p></div>; }
function SignalTile({ icon: Icon, label, note, value }: { icon: typeof Factory; label: string; note: string; value: string }) { return <article className="rounded-xl border border-white/8 bg-white/[.035] p-3"><div className="flex items-center justify-between"><Icon className="size-3.5 text-[#72cfc3]" /><span className="font-mono text-base text-[#dff7f1]">{value}</span></div><p className="mt-3 text-[10px] font-medium">{label}</p><p className="mt-0.5 text-[8px] uppercase tracking-[0.08em] text-[#78949a]">{note}</p></article>; }
function Timeline({ start, end, projectStart, projectEnd, intersection }: { start: number; end: number; projectStart: number; projectEnd: number; intersection: number[] }) { const years = Array.from({ length: end - start + 1 }, (_, i) => start + i); return <div className="mt-5"><div className="flex gap-1">{years.map((year) => <div className={`h-12 flex-1 rounded-sm ${intersection.includes(year) ? 'bg-[#61cfc1]' : year >= projectStart && year <= projectEnd ? 'bg-[#ee9665]' : 'bg-white/7'}`} key={year} title={String(year)} />)}</div><div className="mt-2 flex justify-between font-mono text-[9px] text-[#78949a]"><span>{start}</span><span>{end}</span></div></div>; }
function Bar({ value }: { value: number }) { return <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-[#61cfc1]" style={{ width: `${Math.min(100, Math.max(8, value * 8))}%` }} /></div>; }
function BigNumber({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-[#081f28] p-5"><p className="font-mono text-2xl text-[#dff7f1]">{value}</p><p className="mt-3 text-[9px] uppercase tracking-[0.12em] text-[#829ca2]">{label}</p></div>; }
function Maturity({ label, tone, value }: { label: string; tone: 'teal' | 'blue' | 'amber' | 'orange'; value: number }) { const colors = { teal: 'bg-[#61cfc1]', blue: 'bg-[#75aebe]', amber: 'bg-[#d2b06d]', orange: 'bg-[#ef9664]' }; return <div><div className="flex justify-between text-xs"><span>{label}</span><span className="font-mono text-[#9eb2b7]">{value}/100</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8"><div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${value}%` }} /></div></div>; }
function signed(value: number) { return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`; }
