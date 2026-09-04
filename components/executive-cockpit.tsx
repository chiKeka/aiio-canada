'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  Clipboard,
  CircleAlert,
  Gauge,
  Layers3,
  Route,
  Printer,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-shell';
import { ExecutiveEvidenceLens } from '@/components/executive-evidence-lens';
import { GuidedProjectStory } from '@/components/guided-project-story';
import { DecisionCockpitView, type PinnedDecision } from '@/components/decision-cockpit-view';
import { buildDecisionOutlook } from '@/lib/decision-outlook';
import { buildAssessmentRecord, encodeAssessmentRecord, resolveFocus } from '@/lib/assessment-record';
import { ExecutiveDecisionBrief } from '@/components/executive-decision-brief';
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

type View = 'outlook' | 'cockpit' | 'walkthrough' | 'evidence' | 'brief';

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
  const [shareState, setShareState] = useState('Share inputs');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState('');
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

  const decisionInputs = { assumptions, budgetMillions, priceBasis, projectStart: startYear, durationYears: duration, assetOutcome: analysis.asset.outcome, spendingProfile };
  const assessment = buildDecisionOutlook(decisionInputs, monthlyCalibration as MonthlyEscalationCalibration);
  const focus = resolveFocus(assessment, selectedMonth, selectedDriver);
  const record = buildAssessmentRecord({ inputs: decisionInputs, assessment, analysis, projectName, approvalStage, contingencyPct, comparison, selectedMonth: focus.month, selectedDriver: focus.driverId, generatedAt: new Date().toISOString(), planning: readiness.proxyPlanning });
  const downloadSnapshot = async () => {
    if (!record) return;
    try {
      const data = await encodeAssessmentRecord({ ...record, generated_at: new Date().toISOString() });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'aiio-assessment-snapshot.json'; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportStatus('Snapshot downloaded. Store it with the brief; it is not uploaded.');
    } catch { setExportStatus('Snapshot export failed. Your assessment is unchanged; try again.'); }
  };
  const shareAssessment = async () => {
    const url = new URL(window.location.href);
    const values = { asset: assetId, metro: metroId, budget: String(budgetMillions), start: String(startYear), years: String(duration), name: projectName, basis: priceBasis, stage: approvalStage, contingency: String(contingencyPct), baseline: String(assumptions.annualBaselinePct), peak: String(assumptions.peakAiAnnualPctPoints), capture: String(assumptions.localCapturePct), lag: String(assumptions.lagMonths), uncertainty: String(assumptions.uncertaintyPct) };
    Object.entries(values).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set('profile', spendingProfile);
    window.history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url.toString()); setShareState('Link copied'); }
    catch { setShareState('Copy link from address bar'); }
    window.setTimeout(() => setShareState('Share inputs'), 1800);
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
            </nav><Button className="h-10 border border-white/10 bg-white/5 px-3 text-xs text-white hover:bg-white/10" onClick={shareAssessment}><Clipboard className="size-3.5" />{shareState}</Button><Button aria-label="Open decision brief" className="h-10 border border-white/10 bg-white/5 px-3 text-white hover:bg-white/10" onClick={() => setView('brief')}><Printer className="size-3.5" />Brief</Button></div>
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
                <MonthlyEscalationOutlook selectedMonth={focus.month} setSelectedMonth={setSelectedMonth} selectedDriver={focus.driverId} setSelectedDriver={setSelectedDriver} assumptions={assumptions} assetOutcome={analysis.asset.outcome} budgetMillions={budgetMillions} calibration={monthlyCalibration as MonthlyEscalationCalibration} contingencyPct={contingencyPct} durationYears={duration} onAssumptionsChange={setAssumptions} onSpendingProfileChange={setSpendingProfile} priceBasis={priceBasis} projectStart={startYear} spendingProfile={spendingProfile} />
              ) : view === 'cockpit' ? (
                <DecisionCockpitView analysis={analysis} assessment={assessment} inputs={decisionInputs} approvalStage={approvalStage} projectName={projectName} comparison={comparison} planningChecks={`${readiness.proxyPlanning.passed_check_count}/${readiness.proxyPlanning.check_count}`} />
              ) : view === 'walkthrough' ? (
                <GuidedProjectStory selectedMonth={focus.month} setSelectedMonth={setSelectedMonth} selectedDriver={focus.driverId} setSelectedDriver={setSelectedDriver} analysis={analysis} assessment={assessment} inputs={decisionInputs} projectName={projectName} approvalStage={approvalStage} planningChecks={`${readiness.proxyPlanning.passed_check_count}/${readiness.proxyPlanning.check_count}`} onExplore={setView} />
              ) : view === 'brief' ? (
                <div className="flex h-full min-h-0 flex-col gap-3"><div className="flex flex-wrap items-center gap-2"><Button disabled={!record} onClick={() => window.print()}>Print / Save PDF</Button><Button disabled={!record} onClick={downloadSnapshot}>Download snapshot</Button><p className="text-xs text-[#b5cbd0]">Share inputs reopens the current model. Download preserves this result.</p><output className="text-xs text-[#8be0d3]">{exportStatus}</output></div><ExecutiveDecisionBrief record={record} visible /></div>
              ) : (
                <ExecutiveEvidenceLens analysis={analysis} assessment={assessment} inputs={decisionInputs} planning={readiness.proxyPlanning} projectName={projectName} />
              )}
            </div>
          </div>
        </div>
      </section>
      {view !== 'brief' ? <ExecutiveDecisionBrief record={record} visible={false} /> : null}
    </main>
  );
}





function Control({ children, label }: { children: React.ReactNode; label: string }) { return <label className="block"><span className="mb-1.5 block text-[9px] uppercase tracking-[0.1em] text-[#8fa8ae]">{label}</span>{children}</label>; }
