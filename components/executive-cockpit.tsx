'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  Clipboard,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Factory,
  Gauge,
  Layers3,
  Route,
  Sparkles,
  Printer,
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
import type { PlanningAssumptions } from '@/lib/planning-calibration';

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

type ExecutiveReadiness = { currentSources: number; totalSources: number; trackedProjects: number; representedRegions: number; targetRegions: number; passedIdentificationChecks: number; totalIdentificationChecks: number };

export function ExecutiveCockpit({ readiness }: { readiness: ExecutiveReadiness }) {
  const [view, setView] = useState<View>('outlook');
  const [tourStep, setTourStep] = useState(0);
  const [assetId, setAssetId] = useState<AssetId>('hospital');
  const [metroId, setMetroId] = useState<MetroId>('CMA_835');
  const [budgetMillions, setBudgetMillions] = useState(1200);
  const [startYear, setStartYear] = useState(2029);
  const [duration, setDuration] = useState(5);
  const [projectName, setProjectName] = useState('Regional health centre');
  const [priceBasis, setPriceBasis] = useState('2026-06');
  const [approvalStage, setApprovalStage] = useState('business_case');
  const [contingencyPct, setContingencyPct] = useState(12);
  const [assumptions, setAssumptions] = useState<PlanningAssumptions>({ annualBaselinePct: 3.5, peakAiAnnualPctPoints: 1.25, localCapturePct: 36, lagMonths: 3, uncertaintyPct: 40 });
  const [shareState, setShareState] = useState('Share assessment');
  const [comparison, setComparison] = useState<{ assetId: AssetId; metroId: MetroId; budgetMillions: number; startYear: number; duration: number } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams(window.location.search);
      const asset = query.get('asset') as AssetId | null;
      const metro = query.get('metro') as MetroId | null;
      if (asset && ASSETS[asset]) setAssetId(asset);
      if (metro && METROS[metro]) setMetroId(metro);
      const budget = Number(query.get('budget')); if (budget > 0) setBudgetMillions(budget);
      const start = Number(query.get('start')); if (start >= 2026 && start <= 2040) setStartYear(start);
      const years = Number(query.get('years')); if (years >= 2 && years <= 10) setDuration(years);
      if (query.get('name')) setProjectName(query.get('name')!);
      if (query.get('basis')) setPriceBasis(query.get('basis')!);
      if (query.get('stage')) setApprovalStage(query.get('stage')!);
      const contingency = Number(query.get('contingency')); if (contingency >= 0 && contingency <= 40) setContingencyPct(contingency);
      const nextAssumptions = { annualBaselinePct: Number(query.get('baseline')), peakAiAnnualPctPoints: Number(query.get('peak')), localCapturePct: Number(query.get('capture')), lagMonths: Number(query.get('lag')), uncertaintyPct: Number(query.get('uncertainty')) };
      if (Object.values(nextAssumptions).every(Number.isFinite)) setAssumptions(nextAssumptions);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const analysis = useMemo(
    () => buildDecisionAnalysis({ assetId, duration, metroId, startYear }),
    [assetId, duration, metroId, startYear],
  );

  const completeLabour = analysis.labourRows
    .filter((row) => row.vacancies_per_1_000_2021_employed !== null)
    .sort((a, b) => (b.vacancies_per_1_000_2021_employed ?? 0) - (a.vacancies_per_1_000_2021_employed ?? 0));
  const leadingMaterial = analysis.materials[0];
  const requestedGw = analysis.powerEvidence.requested_load.latest_requested_load_mw / 1000;
  const shareAssessment = async () => {
    const url = new URL(window.location.href);
    const values = { asset: assetId, metro: metroId, budget: String(budgetMillions), start: String(startYear), years: String(duration), name: projectName, basis: priceBasis, stage: approvalStage, contingency: String(contingencyPct), baseline: String(assumptions.annualBaselinePct), peak: String(assumptions.peakAiAnnualPctPoints), capture: String(assumptions.localCapturePct), lag: String(assumptions.lagMonths), uncertainty: String(assumptions.uncertaintyPct) };
    Object.entries(values).forEach(([key, value]) => url.searchParams.set(key, value));
    await navigator.clipboard.writeText(url.toString());
    window.history.replaceState(null, '', url);
    setShareState('Link copied');
    window.setTimeout(() => setShareState('Share assessment'), 1800);
  };

  return (
    <main className="min-h-screen bg-[#071c25] text-white">
      <SiteHeader />
      <section className="executive-screen relative min-h-[calc(100dvh-68px)] overflow-hidden">
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
            <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto"><nav className="flex min-w-0 flex-1 gap-1 rounded-xl border border-white/10 bg-black/20 p-1" aria-label="Executive dashboard views">
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
            </nav><Button className="h-10 border border-white/10 bg-white/5 px-3 text-xs text-white hover:bg-white/10" onClick={shareAssessment}><Clipboard className="size-3.5" />{shareState}</Button><Button aria-label="Print decision record" className="h-10 border border-white/10 bg-white/5 px-3 text-white hover:bg-white/10" onClick={() => window.print()}><Printer className="size-3.5" /></Button></div>
          </header>

          <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="max-h-[calc(100dvh-160px)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d2933]/88 p-4 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between">
                <div><p className="text-[9px] uppercase tracking-[0.15em] text-[#72cfc3]">Project</p><h1 className="mt-1 text-base font-medium">Shape the decision</h1></div>
                <Building2 className="size-5 text-[#72cfc3]" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Control label="Project"><Input className="h-9 border-white/10 bg-white/6 text-white" onChange={(e) => setProjectName(e.target.value)} value={projectName} /></Control>
                <Control label="Asset class"><NativeSelect className="w-full [&>select]:h-9 [&>select]:border-white/10 [&>select]:bg-white/6 [&>select]:text-white" onChange={(e) => setAssetId(e.target.value as AssetId)} value={assetId}>{Object.entries(ASSETS).map(([id, asset]) => <NativeSelectOption key={id} value={id}>{asset.label}</NativeSelectOption>)}</NativeSelect></Control>
                <Control label="Market"><NativeSelect className="w-full [&>select]:h-9 [&>select]:border-white/10 [&>select]:bg-white/6 [&>select]:text-white" onChange={(e) => setMetroId(e.target.value as MetroId)} value={metroId}>{Object.entries(METROS).map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect></Control>
                <div className="grid grid-cols-2 gap-2">
                  <Control label="Estimate ($M)"><Input className="h-9 border-white/10 bg-white/6 font-mono text-white" min="1" onChange={(e) => setBudgetMillions(Math.max(1, Number(e.target.value) || 1))} type="number" value={budgetMillions} /></Control>
                  <Control label="Start"><Input className="h-9 border-white/10 bg-white/6 font-mono text-white" max="2040" min="2026" onChange={(e) => setStartYear(Number(e.target.value) || 2026)} type="number" value={startYear} /></Control>
                </div>
                <div className="grid grid-cols-2 gap-2"><Control label="Price basis"><Input className="h-9 border-white/10 bg-white/6 font-mono text-white" onChange={(e) => setPriceBasis(e.target.value)} type="month" value={priceBasis} /></Control><Control label="Contingency"><Input className="h-9 border-white/10 bg-white/6 font-mono text-white" max="40" min="0" onChange={(e) => setContingencyPct(Math.max(0, Number(e.target.value) || 0))} type="number" value={contingencyPct} /></Control></div>
                <Control label="Approval stage"><NativeSelect className="w-full [&>select]:h-9 [&>select]:border-white/10 [&>select]:bg-white/6 [&>select]:text-white" onChange={(e) => setApprovalStage(e.target.value)} value={approvalStage}><NativeSelectOption value="concept">Concept</NativeSelectOption><NativeSelectOption value="business_case">Business case</NativeSelectOption><NativeSelectOption value="treasury_board">Treasury Board</NativeSelectOption><NativeSelectOption value="procurement">Procurement</NativeSelectOption><NativeSelectOption value="delivery">Delivery</NativeSelectOption></NativeSelect></Control>
                <Control label={`Delivery window · ${duration} years`}><input aria-label="Delivery duration" className="scenario-range mt-2 w-full" max="10" min="2" onChange={(e) => setDuration(Number(e.target.value))} type="range" value={duration} /></Control>
              </div>
              <button className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-[10px] text-[#b8cccf] hover:bg-white/10" onClick={() => setComparison(comparison ? null : { assetId, metroId, budgetMillions, startYear, duration })} type="button">{comparison ? `Comparison pinned · Δ budget $${(budgetMillions - comparison.budgetMillions).toLocaleString()}M` : 'Pin current configuration for comparison'}</button>
              <div className="mt-4 rounded-xl border border-[#ee9665]/30 bg-[#ee9665]/10 p-3">
                <div className="flex items-center gap-2"><CircleAlert className="size-4 shrink-0 text-[#ffab78]" /><p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#efc4aa]">AI cost + delay unquantified</p></div>
              </div>
            </aside>

            <div className="min-h-0">
              {view === 'outlook' ? (
                <MonthlyEscalationOutlook assumptions={assumptions} assetOutcome={analysis.asset.outcome} budgetMillions={budgetMillions} calibration={monthlyCalibration as MonthlyEscalationCalibration} contingencyPct={contingencyPct} durationYears={duration} onAssumptionsChange={setAssumptions} priceBasis={priceBasis} projectStart={startYear} />
              ) : view === 'cockpit' ? (
                <CockpitView analysis={analysis} approvalStage={approvalStage} budgetMillions={budgetMillions} completeLabour={completeLabour} leadingMaterial={leadingMaterial} projectName={projectName} requestedGw={requestedGw} />
              ) : view === 'walkthrough' ? (
                <Walkthrough analysis={analysis} budgetMillions={budgetMillions} readiness={readiness} setTourStep={setTourStep} tourStep={tourStep} />
              ) : (
                <EvidenceView analysis={analysis} completeLabour={completeLabour} readiness={readiness} requestedGw={requestedGw} />
              )}
            </div>
          </div>
        </div>
      </section>
      <ExecutivePrintRecord analysis={analysis} approvalStage={approvalStage} assumptions={assumptions} budgetMillions={budgetMillions} contingencyPct={contingencyPct} priceBasis={priceBasis} projectName={projectName} readiness={readiness} />
    </main>
  );
}

function CockpitView({ analysis, approvalStage, budgetMillions, completeLabour, leadingMaterial, projectName, requestedGw }: {
  analysis: ReturnType<typeof buildDecisionAnalysis>;
  approvalStage: string;
  budgetMillions: number;
  completeLabour: ReturnType<typeof buildDecisionAnalysis>['labourRows'];
  leadingMaterial: ReturnType<typeof buildDecisionAnalysis>['materials'][number] | undefined;
  requestedGw: number;
  projectName: string;
}) {
  return <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
    <section className="flex min-h-[570px] flex-col rounded-2xl border border-white/10 bg-[#0d2933]/88 p-5 shadow-2xl shadow-black/20 backdrop-blur lg:min-h-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-[9px] uppercase tracking-[0.16em] text-[#72cfc3]">{approvalStage.replaceAll('_', ' ')} · {projectName}</p><h2 className="mt-1 text-2xl font-medium tracking-[-0.035em]">Impact path</h2></div>
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
        <p className="mt-4 text-3xl font-medium leading-none tracking-[-0.04em]">Market-test before approval.</p>
        <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-[#a9bec2]"><Check className="size-3.5 text-[#70d3c5]" /> No blanket AI premium</div><p className="mt-2 text-[10px] leading-4 text-[#8fa8ae]">Next gate: validate {analysis.dominantNode?.label.toLowerCase() ?? 'priority trade'} capacity and utility interfaces.</p>
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
  const [selected, setSelected] = useState<'shock' | 'constraint' | 'exposure'>('constraint');
  const trade = analysis.dominantNode?.label ?? 'Priority trade pathway';
  const detail = {
    shock: ['$50B AI infrastructure scenario', 'Counterfactual capital flow over 10 years—not observed spending.'],
    constraint: [trade, `${analysis.directEdges.length} direct constraint edges feed this asset's delivery outcome.`],
    exposure: [analysis.asset.label, `${analysis.scenarioWindowYears.length} intersecting scenario years. AI-attributable impact remains uncalibrated.`],
  }[selected];
  return <div className="relative my-5 flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-[#081f28] p-4">
    <div className="cockpit-orbit absolute size-[420px] rounded-full border border-[#4fc5b6]/12" aria-hidden="true" />
    <div className="cockpit-orbit absolute size-[300px] rounded-full border border-[#4fc5b6]/16" aria-hidden="true" />
    <div className="relative grid w-full max-w-3xl grid-cols-[1fr_36px_1fr_36px_1fr] items-center gap-1 text-center">
      <MapNode eyebrow="Shock" icon={Factory} onSelect={() => setSelected('shock')} selected={selected === 'shock'} title="$50B scenario" tone="teal" />
      <FlowLine />
      <MapNode eyebrow="Constraint" icon={Users} onSelect={() => setSelected('constraint')} selected={selected === 'constraint'} title={trade} tone="blue" />
      <FlowLine />
      <MapNode eyebrow="Exposure" icon={Building2} onSelect={() => setSelected('exposure')} selected={selected === 'exposure'} title={analysis.asset.label} tone="orange" />
    </div>
    <div className="absolute inset-x-4 bottom-3 rounded-lg border border-white/8 bg-[#061820]/90 px-3 py-2 text-left"><p className="text-[9px] font-medium text-[#dff7f1]">{detail[0]}</p><p className="mt-0.5 text-[8px] leading-3 text-[#78949a]">{detail[1]}</p></div>
  </div>;
}

function Walkthrough({ analysis, budgetMillions, readiness, setTourStep, tourStep }: { analysis: ReturnType<typeof buildDecisionAnalysis>; budgetMillions: number; readiness: ExecutiveReadiness; setTourStep: (value: number) => void; tourStep: number }) {
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
      <TourVisual analysis={analysis} budgetMillions={budgetMillions} kind={step.visual} readiness={readiness} />
    </div>
  </section>;
}

function TourVisual({ analysis, budgetMillions, kind, readiness }: { analysis: ReturnType<typeof buildDecisionAnalysis>; budgetMillions: number; kind: typeof tour[number]['visual']; readiness: ExecutiveReadiness }) {
  if (kind === 'graph') return <div className="flex min-h-[360px] items-center p-6"><ImpactMap analysis={analysis} /></div>;
  if (kind === 'signals') { const labour = analysis.labourRows.filter((row) => row.vacancies_per_1_000_2021_employed !== null).sort((a, b) => (b.vacancies_per_1_000_2021_employed ?? 0) - (a.vacancies_per_1_000_2021_employed ?? 0))[0]; return <div className="grid content-center gap-3 p-6 sm:grid-cols-2"><BigNumber label="Leading material · observed YoY" value={analysis.materials[0] ? signed(analysis.materials[0].year_over_year_percent_change) : 'n/a'} /><BigNumber label="Leading labour · vacancies/1k" value={labour?.vacancies_per_1_000_2021_employed?.toFixed(1) ?? 'n/a'} /><BigNumber label="Tracked public projects · BC/ON/QC" value={readiness.trackedProjects.toLocaleString()} /><BigNumber label="Requested power · not connected" value={`${(analysis.powerEvidence.requested_load.latest_requested_load_mw / 1000).toFixed(1)} GW`} /></div>; }
  if (kind === 'decision') return <div className="flex items-center justify-center p-8"><div className="w-full max-w-xl"><div className="text-center"><CircleAlert className="mx-auto size-7 text-[#ff9d66]" /><p className="mt-3 text-2xl font-medium">Market-test before approval</p><p className="mt-2 text-xs text-[#a9bcc1]">AI premium remains withheld</p></div><div className="mt-6 grid gap-2 sm:grid-cols-2">{['Retain independent baseline','Test priority trade market','Confirm utility interfaces','Refresh at every estimate gate'].map((gate, index) => <div className="rounded-xl border border-white/10 bg-[#081f28] p-3 text-[10px] text-[#cbdadc]" key={gate}><span className="mr-2 font-mono text-[#72cfc3]">0{index + 1}</span>{gate}</div>)}</div></div></div>;
  return <div className="flex items-center justify-center p-8"><div className="grid w-full max-w-lg gap-3 sm:grid-cols-2"><BigNumber label="Capital decision" value={`$${budgetMillions.toLocaleString()}M`} /><BigNumber label="Delivery" value={`${analysis.endYear - (analysis.endYear - analysis.scenarioWindowYears.length + 1) + 1 || 0} yrs`} /><BigNumber label="Region" value={METROS[analysis.metroId].replace(' region', '')} /><BigNumber label="Asset" value={analysis.asset.label.split(' or ')[0]} /></div></div>;
}

function EvidenceView({ analysis, completeLabour, readiness, requestedGw }: { analysis: ReturnType<typeof buildDecisionAnalysis>; completeLabour: ReturnType<typeof buildDecisionAnalysis>['labourRows']; readiness: ExecutiveReadiness; requestedGw: number }) {
  const channels = [
    { icon: Factory, label: 'Materials', value: analysis.materials[0] ? signed(analysis.materials[0].year_over_year_percent_change) : 'n/a', note: 'leading observed component change' },
    { icon: Users, label: 'Labour', value: completeLabour[0]?.vacancies_per_1_000_2021_employed?.toFixed(1) ?? 'n/a', note: 'vacancies per 1,000 employed' },
    { icon: Building2, label: 'Tracked projects', value: readiness.trackedProjects.toLocaleString(), note: 'hospital, education and civic · BC/ON/QC' },
    { icon: Zap, label: 'Power', value: `${requestedGw.toFixed(1)} GW`, note: 'requested—not connected—load' },
  ];
  const maturity = [
    { label: 'Source freshness', value: Math.round(readiness.currentSources / readiness.totalSources * 100), note: `${readiness.currentSources}/${readiness.totalSources} verified within cadence`, tone: 'teal' as const },
    { label: 'Target-region baseline', value: Math.round(readiness.representedRegions / readiness.targetRegions * 100), note: `${readiness.representedRegions}/${readiness.targetRegions} candidate regions represented`, tone: 'blue' as const },
    { label: 'Identification checks', value: Math.round(readiness.passedIdentificationChecks / readiness.totalIdentificationChecks * 100), note: `${readiness.passedIdentificationChecks}/${readiness.totalIdentificationChecks} checks passed`, tone: 'amber' as const },
    { label: 'Authorizing treatment', value: 0, note: '0/8 screened sources qualify', tone: 'orange' as const },
  ];
  return <section className="grid h-full min-h-[610px] gap-4 lg:min-h-0 lg:grid-cols-[1.1fr_.9fr]">
    <div className="rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><p className="text-[9px] uppercase tracking-[0.15em] text-[#72cfc3]">Evidence lens · {analysis.analysisDate}</p><h2 className="mt-2 text-2xl font-medium">Four signals. No forced composite.</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{channels.map(({ icon: Icon, label, note, value }) => <article className="rounded-2xl border border-white/10 bg-[#081f28] p-5" key={label}><div className="flex items-center justify-between"><Icon className="size-5 text-[#72cfc3]" /><span className="font-mono text-3xl text-[#dff7f1]">{value}</span></div><p className="mt-7 text-[10px] font-medium uppercase tracking-[0.1em] text-[#a9bcc1]">{label}</p><p className="mt-1 text-[9px] leading-4 text-[#78949a]">{note}</p></article>)}</div></div>
    <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><p className="text-[9px] uppercase tracking-[0.15em] text-[#72cfc3]">Evidence readiness · reproducible ratios</p><div className="mt-5 space-y-5">{maturity.map((item) => <Maturity key={item.label} {...item} />)}</div><div className="mt-auto rounded-xl border border-[#ff9d66]/25 bg-[#ff9d66]/8 p-4 font-mono text-[9px] uppercase tracking-[0.1em] text-[#efc4aa]">Coverage ratios · not probability or confidence</div></div>
  </section>;
}

function ExecutivePrintRecord({ analysis, approvalStage, assumptions, budgetMillions, contingencyPct, priceBasis, projectName, readiness }: { analysis: ReturnType<typeof buildDecisionAnalysis>; approvalStage: string; assumptions: PlanningAssumptions; budgetMillions: number; contingencyPct: number; priceBasis: string; projectName: string; readiness: ExecutiveReadiness }) {
  return <article className="executive-print-record" id="executive-decision-brief">
    <header><p>AI Infrastructure Impact Observatory</p><h1>Executive decision record</h1><p>Generated {new Date().toLocaleDateString('en-CA')}</p></header>
    <section><h2>{projectName}</h2><dl><div><dt>Asset</dt><dd>{analysis.asset.label}</dd></div><div><dt>Market</dt><dd>{METROS[analysis.metroId]}</dd></div><div><dt>Estimate</dt><dd>${budgetMillions.toLocaleString()}M · {priceBasis} dollars</dd></div><div><dt>Approval stage</dt><dd>{approvalStage.replaceAll('_', ' ')}</dd></div><div><dt>Delivery</dt><dd>{analysis.startYear}–{analysis.endYear}</dd></div><div><dt>Existing contingency</dt><dd>{contingencyPct}% · ${(budgetMillions * contingencyPct / 100).toLocaleString()}M</dd></div></dl></section>
    <section><h2>Decision</h2><p className="print-decision">Market-test before approval.</p><p>Do not apply a blanket AI premium. Validate {analysis.dominantNode?.label.toLowerCase() ?? 'priority trade'} capacity, confirm utility interfaces, and refresh the estimate at each approval gate.</p></section>
    <section><h2>Scenario boundary</h2><dl><div><dt>Scenario</dt><dd>$50B over 10 years</dd></div><div><dt>Baseline</dt><dd>{assumptions.annualBaselinePct}% annually</dd></div><div><dt>Peak AI increment</dt><dd>{assumptions.peakAiAnnualPctPoints} percentage points</dd></div><div><dt>Local capture</dt><dd>{assumptions.localCapturePct}%</dd></div><div><dt>Lag</dt><dd>{assumptions.lagMonths} months</dd></div><div><dt>Uncertainty</dt><dd>±{assumptions.uncertaintyPct}%</dd></div></dl><p><strong>AI-attributable cost and delay remain uncalibrated.</strong> Scenario dollars are planning sensitivity, not a forecast or approved estimate adjustment.</p></section>
    <section><h2>Evidence readiness</h2><dl><div><dt>Fresh sources</dt><dd>{readiness.currentSources}/{readiness.totalSources}</dd></div><div><dt>Target regions</dt><dd>{readiness.representedRegions}/{readiness.targetRegions}</dd></div><div><dt>Identification checks</dt><dd>{readiness.passedIdentificationChecks}/{readiness.totalIdentificationChecks}</dd></div><div><dt>Authorizing treatment</dt><dd>0/8</dd></div></dl></section>
  </article>;
}

function Control({ children, label }: { children: React.ReactNode; label: string }) { return <label className="block"><span className="mb-1.5 block text-[9px] uppercase tracking-[0.1em] text-[#8fa8ae]">{label}</span>{children}</label>; }
function FlowLine() { return <div className="relative h-px bg-gradient-to-r from-[#58cbbd] to-[#ef9664]"><ArrowRight className="absolute -right-1.5 -top-2 size-4 text-[#ef9664]" /></div>; }
function MapNode({ eyebrow, icon: Icon, onSelect, selected, title, tone }: { eyebrow: string; icon: typeof Factory; onSelect: () => void; selected: boolean; title: string; tone: 'teal' | 'blue' | 'orange' }) { const styles = tone === 'orange' ? 'border-[#ee9665]/40 bg-[#ee9665]/12 text-[#ffc6a3]' : tone === 'blue' ? 'border-[#75aebe]/35 bg-[#75aebe]/10 text-[#b9e0e8]' : 'border-[#58cbbd]/40 bg-[#58cbbd]/10 text-[#a9eee4]'; return <button aria-pressed={selected} className={`relative z-10 flex min-h-36 flex-col items-center justify-center rounded-full border p-3 shadow-xl shadow-black/20 transition hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dff7f1] ${selected ? 'ring-2 ring-white/50' : ''} ${styles}`} onClick={onSelect} type="button"><Icon className="size-5" /><p className="mt-3 text-[8px] uppercase tracking-[0.14em] opacity-70">{eyebrow}</p><p className="mt-1 max-w-28 text-xs font-medium leading-4">{title}</p></button>; }
function SignalTile({ icon: Icon, label, note, value }: { icon: typeof Factory; label: string; note: string; value: string }) { return <article className="rounded-xl border border-white/8 bg-white/[.035] p-3"><div className="flex items-center justify-between"><Icon className="size-3.5 text-[#72cfc3]" /><span className="font-mono text-base text-[#dff7f1]">{value}</span></div><p className="mt-3 text-[10px] font-medium">{label}</p><p className="mt-0.5 text-[8px] uppercase tracking-[0.08em] text-[#78949a]">{note}</p></article>; }
function Timeline({ start, end, projectStart, projectEnd, intersection }: { start: number; end: number; projectStart: number; projectEnd: number; intersection: number[] }) { const years = Array.from({ length: end - start + 1 }, (_, i) => start + i); return <div className="mt-5"><div className="flex gap-1">{years.map((year) => <div className={`h-12 flex-1 rounded-sm ${intersection.includes(year) ? 'bg-[#61cfc1]' : year >= projectStart && year <= projectEnd ? 'bg-[#ee9665]' : 'bg-white/7'}`} key={year} title={String(year)} />)}</div><div className="mt-2 flex justify-between font-mono text-[9px] text-[#78949a]"><span>{start}</span><span>{end}</span></div></div>; }
function BigNumber({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-[#081f28] p-5"><p className="font-mono text-2xl text-[#dff7f1]">{value}</p><p className="mt-3 text-[9px] uppercase tracking-[0.12em] text-[#829ca2]">{label}</p></div>; }
function Maturity({ label, note, tone, value }: { label: string; note: string; tone: 'teal' | 'blue' | 'amber' | 'orange'; value: number }) {
  const colors = { teal: 'bg-[#61cfc1]', blue: 'bg-[#75aebe]', amber: 'bg-[#d2b06d]', orange: 'bg-[#ef9664]' };
  return <div><div className="flex justify-between text-xs"><span>{label}</span><span className="font-mono text-[#9eb2b7]">{value}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8"><div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${value}%` }} /></div><p className="mt-1.5 text-[9px] text-[#78949a]">{note}</p></div>;
}
function signed(value: number) { return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`; }
