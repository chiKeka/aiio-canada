'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  Clipboard,
  CircleAlert,
  Factory,
  Gauge,
  Layers3,
  Route,
  Printer,
  Users,
  Zap,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-shell';
import { GuidedProjectStory } from '@/components/guided-project-story';
import { DecisionCockpitView, type PinnedDecision } from '@/components/decision-cockpit-view';
import { buildDecisionOutlook, decisionAction } from '@/lib/decision-outlook';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { MonthlyEscalationOutlook, type MonthlyEscalationCalibration } from '@/components/monthly-escalation-outlook';
import { ASSETS, buildDecisionAnalysis, METROS, type AssetId, type MetroId } from '@/lib/decision-analysis';
import monthlyCalibration from '@/data/model-runs/executive_monthly_escalation_current.json';
import releaseData from '@/public/data/latest.json';
import type { PlanningAssumptions } from '@/lib/planning-calibration';
import { monthNumber, queryNumber, SPENDING_PROFILES, type SpendingProfile } from '@/lib/project-cashflow';

type View = 'outlook' | 'cockpit' | 'walkthrough' | 'evidence';

const views: { id: View; label: string; icon: typeof Gauge }[] = [
  { id: 'outlook', label: 'Monthly outlook', icon: Activity },
  { id: 'cockpit', label: 'Decision cockpit', icon: Gauge },
  { id: 'walkthrough', label: 'Guided story', icon: Route },
  { id: 'evidence', label: 'Evidence lens', icon: Layers3 },
];


type ExecutiveReadiness = { proxyPlanning: { status: string; passed_check_count: number; check_count: number; checks: { id: string; status: string; finding: string; next_step: string | null }[] }; currentSources: number; totalSources: number; trackedProjects: number; representedRegions: number; targetRegions: number; passedIdentificationChecks: number; totalIdentificationChecks: number };

export function ExecutiveCockpit({ readiness }: { readiness: ExecutiveReadiness }) {
  const [view, setView] = useState<View>('outlook');
  const [assetId, setAssetId] = useState<AssetId>('hospital');
  const [metroId, setMetroId] = useState<MetroId>('CMA_835');
  const [budgetMillions, setBudgetMillions] = useState(1200);
  const [startYear, setStartYear] = useState(2029);
  const [duration, setDuration] = useState(5);
  const [projectName, setProjectName] = useState('Regional health centre');
  const [priceBasis, setPriceBasis] = useState('2026-06');
  const [approvalStage, setApprovalStage] = useState('business_case');
  const [contingencyPct, setContingencyPct] = useState(12);
  const [spendingProfile, setSpendingProfile] = useState<SpendingProfile>('bell');
  const [assumptions, setAssumptions] = useState<PlanningAssumptions>({ annualBaselinePct: 3.5, peakAiAnnualPctPoints: 1.25, localCapturePct: 36, lagMonths: 3, uncertaintyPct: 40 });
  const [shareState, setShareState] = useState('Share assessment');
  const [comparison, setComparison] = useState<PinnedDecision | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams(window.location.search);
      const asset = query.get('asset') as AssetId | null;
      const metro = query.get('metro') as MetroId | null;
      if (asset && Object.hasOwn(ASSETS, asset)) setAssetId(asset);
      if (metro && Object.hasOwn(METROS, metro)) setMetroId(metro);
      const budget = queryNumber(query, 'budget', 1, 1_000_000); if (budget !== undefined) setBudgetMillions(budget);
      const start = queryNumber(query, 'start', 2026, 2040, true); if (start !== undefined) setStartYear(start);
      const years = queryNumber(query, 'years', 2, 10, true); if (years !== undefined) setDuration(years);
      if (query.get('name')) setProjectName(query.get('name')!.slice(0, 160));
      const basis = query.get('basis'); if (basis && monthNumber(basis) !== null) setPriceBasis(basis);
      const stage = query.get('stage'); if (stage && ['concept', 'business_case', 'treasury_board', 'procurement', 'delivery'].includes(stage)) setApprovalStage(stage);
      const profile = query.get('profile'); if (profile && Object.hasOwn(SPENDING_PROFILES, profile)) setSpendingProfile(profile as SpendingProfile);
      const contingency = queryNumber(query, 'contingency', 0, 40); if (contingency !== undefined) setContingencyPct(contingency);
      setAssumptions((current) => ({
        annualBaselinePct: queryNumber(query, 'baseline', 0, 12) ?? current.annualBaselinePct,
        peakAiAnnualPctPoints: queryNumber(query, 'peak', 0, 8) ?? current.peakAiAnnualPctPoints,
        localCapturePct: queryNumber(query, 'capture', 0, 80) ?? current.localCapturePct,
        lagMonths: queryNumber(query, 'lag', 0, 24, true) ?? current.lagMonths,
        uncertaintyPct: queryNumber(query, 'uncertainty', 0, 100) ?? current.uncertaintyPct,
      }));
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
  const decisionInputs = { assumptions, budgetMillions, priceBasis, projectStart: startYear, durationYears: duration, assetOutcome: analysis.asset.outcome, spendingProfile };
  const assessment = buildDecisionOutlook(decisionInputs, monthlyCalibration as MonthlyEscalationCalibration);
  const requestedGw = analysis.powerEvidence.requested_load.latest_requested_load_mw / 1000;
  const shareAssessment = async () => {
    const url = new URL(window.location.href);
    const values = { asset: assetId, metro: metroId, budget: String(budgetMillions), start: String(startYear), years: String(duration), name: projectName, basis: priceBasis, stage: approvalStage, contingency: String(contingencyPct), baseline: String(assumptions.annualBaselinePct), peak: String(assumptions.peakAiAnnualPctPoints), capture: String(assumptions.localCapturePct), lag: String(assumptions.lagMonths), uncertainty: String(assumptions.uncertaintyPct) };
    Object.entries(values).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set('profile', spendingProfile);
    window.history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url.toString()); setShareState('Link copied'); }
    catch { setShareState('Copy link from address bar'); }
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
                  <Control label="Base budget ($M)"><Input className="h-9 border-white/10 bg-white/6 font-mono text-white" min="1" onChange={(e) => setBudgetMillions(Math.max(1, Number(e.target.value) || 1))} type="number" value={budgetMillions} /></Control>
                  <Control label="Start"><Input className="h-9 border-white/10 bg-white/6 font-mono text-white" max="2040" min="2026" onChange={(e) => setStartYear(Number(e.target.value) || 2026)} type="number" value={startYear} /></Control>
                </div>
                <div className="grid grid-cols-2 gap-2"><Control label="Price basis"><Input className="h-9 border-white/10 bg-white/6 font-mono text-white" onChange={(e) => setPriceBasis(e.target.value)} type="month" value={priceBasis} /></Control><Control label="Contingency"><Input className="h-9 border-white/10 bg-white/6 font-mono text-white" max="40" min="0" onChange={(e) => setContingencyPct(Math.max(0, Number(e.target.value) || 0))} type="number" value={contingencyPct} /></Control></div>
                <Control label="Approval stage"><NativeSelect className="w-full [&>select]:h-9 [&>select]:border-white/10 [&>select]:bg-white/6 [&>select]:text-white" onChange={(e) => setApprovalStage(e.target.value)} value={approvalStage}><NativeSelectOption value="concept">Concept</NativeSelectOption><NativeSelectOption value="business_case">Business case</NativeSelectOption><NativeSelectOption value="treasury_board">Treasury Board</NativeSelectOption><NativeSelectOption value="procurement">Procurement</NativeSelectOption><NativeSelectOption value="delivery">Delivery</NativeSelectOption></NativeSelect></Control>
                <Control label={`Delivery window · ${duration} years`}><input aria-label="Delivery duration" className="scenario-range mt-2 w-full" max="10" min="2" onChange={(e) => setDuration(Number(e.target.value))} type="range" value={duration} /></Control>
              </div>
              <button className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-[#b8cccf] hover:bg-white/10" onClick={() => setComparison(comparison ? null : { inputs: decisionInputs, assessment, market: METROS[metroId] })} type="button">{comparison ? 'Configuration pinned · click to clear' : 'Pin current configuration for comparison'}</button>
              <div className="mt-4 rounded-xl border border-[#ee9665]/30 bg-[#ee9665]/10 p-3">
                <div className="flex items-center gap-2"><CircleAlert className="size-4 shrink-0 text-[#ffab78]" /><p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#efc4aa]">AI cost + delay unquantified</p></div>
              </div>
            </aside>

            <div className="min-h-0">
              {view === 'outlook' ? (
                <MonthlyEscalationOutlook assumptions={assumptions} assetOutcome={analysis.asset.outcome} budgetMillions={budgetMillions} calibration={monthlyCalibration as MonthlyEscalationCalibration} contingencyPct={contingencyPct} durationYears={duration} onAssumptionsChange={setAssumptions} onSpendingProfileChange={setSpendingProfile} priceBasis={priceBasis} projectStart={startYear} spendingProfile={spendingProfile} />
              ) : view === 'cockpit' ? (
                <DecisionCockpitView analysis={analysis} assessment={assessment} inputs={decisionInputs} approvalStage={approvalStage} projectName={projectName} comparison={comparison} planningChecks={`${readiness.proxyPlanning.passed_check_count}/${readiness.proxyPlanning.check_count}`} />
              ) : view === 'walkthrough' ? (
                <GuidedProjectStory analysis={analysis} assessment={assessment} inputs={decisionInputs} projectName={projectName} approvalStage={approvalStage} planningChecks={`${readiness.proxyPlanning.passed_check_count}/${readiness.proxyPlanning.check_count}`} onExplore={setView} />
              ) : (
                <EvidenceView analysis={analysis} completeLabour={completeLabour} readiness={readiness} requestedGw={requestedGw} />
              )}
            </div>
          </div>
        </div>
      </section>
      <ExecutivePrintRecord analysis={analysis} approvalStage={approvalStage} assumptions={assumptions} budgetMillions={budgetMillions} contingencyPct={contingencyPct} priceBasis={priceBasis} projectName={projectName} readiness={readiness} spendingProfile={spendingProfile} />
    </main>
  );
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
    { label: 'Causal identification only', value: Math.round(readiness.passedIdentificationChecks / readiness.totalIdentificationChecks * 100), note: `${readiness.passedIdentificationChecks}/${readiness.totalIdentificationChecks} checks passed · not a planning prerequisite`, tone: 'amber' as const },
  ];
  return <section className="grid h-full min-h-[610px] gap-4 lg:min-h-0 lg:grid-cols-[1.1fr_.9fr]">
    <div className="rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><p className="text-[9px] uppercase tracking-[0.15em] text-[#72cfc3]">Evidence lens · {analysis.analysisDate}</p><h2 className="mt-2 text-2xl font-medium">Four signals. No forced composite.</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{channels.map(({ icon: Icon, label, note, value }) => <article className="rounded-2xl border border-white/10 bg-[#081f28] p-5" key={label}><div className="flex items-center justify-between"><Icon className="size-5 text-[#72cfc3]" /><span className="font-mono text-3xl text-[#dff7f1]">{value}</span></div><p className="mt-7 text-[10px] font-medium uppercase tracking-[0.1em] text-[#a9bcc1]">{label}</p><p className="mt-1 text-[9px] leading-4 text-[#78949a]">{note}</p></article>)}</div></div>
    <div className="flex flex-col overflow-y-auto rounded-2xl border border-white/10 bg-[#0d2933]/90 p-5"><p className="text-sm text-[#72cfc3]">Three evidence levels</p><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-[#8be0d3]">Observed conditions</dt><dd>Available with source dates and scope</dd></div><div><dt className="text-[#ffd0b4]">Proxy-based planning</dt><dd>Scenarios available · validation incomplete</dd><dd className="mt-1 text-xs text-[#a9bcc1]">{readiness.proxyPlanning.passed_check_count}/{readiness.proxyPlanning.check_count} checks passed. No private spending or labour-hour data required.</dd></div><div><dt className="text-[#a9bcc1]">Causal AI attribution</dt><dd>Separate identification gate · withheld</dd></div></dl><details className="mt-4 rounded-xl border border-white/10 p-3"><summary className="cursor-pointer text-sm">Planning validation and next steps</summary><ul className="mt-3 space-y-3 text-sm">{readiness.proxyPlanning.checks.map((check) => <li key={check.id}><p className="font-medium">{check.id.replaceAll('_', ' ')} · {check.status.replaceAll('_', ' ')}</p><p className="mt-1 text-[#a9bcc1]">{check.finding}</p>{check.next_step ? <p className="mt-1 text-[#dff7f1]">Next: {check.next_step}</p> : null}</li>)}</ul></details><div className="mt-5 space-y-5">{maturity.map((item) => <Maturity key={item.label} {...item} />)}</div><p className="mt-4 text-xs text-[#a9bcc1]">Coverage ratios are not probability or confidence.</p></div>
  </section>;
}

function ExecutivePrintRecord({ analysis, approvalStage, assumptions, budgetMillions, contingencyPct, priceBasis, projectName, readiness, spendingProfile }: { analysis: ReturnType<typeof buildDecisionAnalysis>; approvalStage: string; assumptions: PlanningAssumptions; budgetMillions: number; contingencyPct: number; priceBasis: string; projectName: string; readiness: ExecutiveReadiness; spendingProfile: SpendingProfile }) {
  return <article className="executive-print-record" id="executive-decision-brief">
    <header><p>AI Infrastructure Impact Observatory</p><h1>Executive decision record</h1><p>Generated {new Date().toLocaleDateString('en-CA')}</p></header>
    <section><h2>{projectName}</h2><dl><div><dt>Asset</dt><dd>{analysis.asset.label}</dd></div><div><dt>Market</dt><dd>{METROS[analysis.metroId]}</dd></div><div><dt>Estimate</dt><dd>${budgetMillions.toLocaleString()}M · {priceBasis} dollars</dd></div><div><dt>Approval stage</dt><dd>{approvalStage.replaceAll('_', ' ')}</dd></div><div><dt>Delivery</dt><dd>{analysis.startYear}–{analysis.endYear}</dd></div><div><dt>Existing contingency</dt><dd>{contingencyPct}% · ${(budgetMillions * contingencyPct / 100).toLocaleString()}M</dd></div></dl></section>
    <section><h2>Decision</h2><p className="print-decision">{decisionAction(approvalStage).title}</p><p>{decisionAction(approvalStage).why} {decisionAction(approvalStage).when}. No causal AI attribution or quantified mitigation savings.</p></section>
    <section><h2>Scenario boundary</h2><p>Spending profile: {SPENDING_PROFILES[spendingProfile]} (assumed). Base budget excludes contingency; the price-basis month has index 1.</p><dl><div><dt>Scenario</dt><dd>$50B over 10 years</dd></div><div><dt>Baseline</dt><dd>{assumptions.annualBaselinePct}% annually</dd></div><div><dt>Peak AI increment</dt><dd>{assumptions.peakAiAnnualPctPoints} percentage points</dd></div><div><dt>Local capture</dt><dd>{assumptions.localCapturePct}%</dd></div><div><dt>Lag</dt><dd>{assumptions.lagMonths} months</dd></div><div><dt>Uncertainty</dt><dd>±{assumptions.uncertaintyPct}%</dd></div></dl><p><strong>AI-attributable cost and delay remain uncalibrated.</strong> Scenario dollars are planning sensitivity, not a forecast or approved estimate adjustment.</p></section>
    <section><h2>Evidence readiness</h2><dl><div><dt>Fresh sources</dt><dd>{readiness.currentSources}/{readiness.totalSources}</dd></div><div><dt>Target regions</dt><dd>{readiness.representedRegions}/{readiness.targetRegions}</dd></div><div><dt>Identification checks</dt><dd>{readiness.passedIdentificationChecks}/{readiness.totalIdentificationChecks}</dd></div><div><dt>Authorizing treatment</dt><dd>0/8</dd></div></dl></section>
  </article>;
}

function Control({ children, label }: { children: React.ReactNode; label: string }) { return <label className="block"><span className="mb-1.5 block text-[9px] uppercase tracking-[0.1em] text-[#8fa8ae]">{label}</span>{children}</label>; }
function Maturity({ label, note, tone, value }: { label: string; note: string; tone: 'teal' | 'blue' | 'amber' | 'orange'; value: number }) {
  const colors = { teal: 'bg-[#61cfc1]', blue: 'bg-[#75aebe]', amber: 'bg-[#d2b06d]', orange: 'bg-[#ef9664]' };
  return <div><div className="flex justify-between text-xs"><span>{label}</span><span className="font-mono text-[#9eb2b7]">{value}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8"><div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${value}%` }} /></div><p className="mt-1.5 text-[9px] text-[#78949a]">{note}</p></div>;
}
function signed(value: number) { return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`; }
