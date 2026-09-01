'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown, ArrowRight, ArrowUp, Building2, CalendarRange, Construction,
  Factory, LockKeyhole, MapPin, Network, Printer, ShieldCheck, Users, Zap,
} from 'lucide-react';

import { ImpactPathGraph } from '@/components/impact-path-graph';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  ASSETS, buildDecisionAnalysis, METROS, type AssetId, type MetroId,
} from '@/lib/decision-analysis';
import releaseData from '@/public/data/latest.json';
import historicalEnvelope from '@/data/model-runs/alberta_bcpi_historical_envelope_v0.1.json';
import historicalAnalogMatrix from '@/data/model-runs/alberta_project_historical_analog_matrix_v0.1.json';
import auditedProjectOutcomes from '@/data/model-runs/oago_audited_project_outcomes_v0.1.json';
import quebecFullArchive from '@/data/model-runs/quebec_pqi_full_archive_longitudinal_v0.1.json';
import quebecProjectRevisions from '@/data/model-runs/quebec_pqi_authorized_project_revisions_v0.1.json';
import regionalMacroControls from '@/data/model-runs/regional_macro_controls_canada_v0.1.json';

const COMPONENT_LABELS: Record<string, string> = {
  concrete: 'Concrete', electrical_systems: 'Electrical systems', hvac: 'HVAC',
  structural_steel_framing: 'Structural steel',
};
const LABOUR_LABELS: Record<string, string> = {
  trade_concrete: 'Concrete trades', trade_electricians: 'Building electricians',
  trade_hvac: 'HVAC mechanics', trade_power_line: 'Power-line trades',
};
const ASSET_TO_HISTORICAL_CLASS: Partial<Record<AssetId, string>> = {
  hospital: 'health_facilities',
  school: 'schools_and_postsecondary',
  government: 'government_and_civic_facilities',
  municipal: 'municipal_operations_facilities',
};
type SpendProfileId = 'front_loaded' | 'even' | 'back_loaded';
const SPEND_PROFILE_LABELS: Record<SpendProfileId, string> = {
  front_loaded: 'Front-loaded',
  even: 'Even annual spend',
  back_loaded: 'Back-loaded',
};

export function DecisionWorkbench() {
  const [projectName, setProjectName] = useState('New regional health centre');
  const [assetId, setAssetId] = useState<AssetId>('hospital');
  const [metroId, setMetroId] = useState<MetroId>('CMA_835');
  const [budgetMillions, setBudgetMillions] = useState(1200);
  const [startYear, setStartYear] = useState(2029);
  const [duration, setDuration] = useState(5);
  const [spendProfile, setSpendProfile] = useState<SpendProfileId>('even');
  const [priceBasisConfirmed, setPriceBasisConfirmed] = useState(false);
  const analysis = useMemo(
    () => buildDecisionAnalysis({ assetId, duration, metroId, startYear }),
    [assetId, duration, metroId, startYear],
  );

  return (
    <main className="min-h-screen bg-[#f7f6f1] text-[#17343d]">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-[#e0dfd8] bg-[#faf9f5]">
        <div className="observatory-grid absolute inset-0 opacity-55" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1440px] gap-7 px-5 py-9 sm:px-8 lg:grid-cols-[1fr_360px] lg:px-12 lg:py-12">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border-[#b8d4cc] bg-[#e6f1ed] text-[#155d56]">Executive decision workspace</Badge>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b6d69]">Alberta pilot · release {releaseData.manifest.version}</span>
            </div>
            <h1 className="max-w-4xl text-balance text-4xl font-normal leading-[1.05] tracking-[-0.045em] text-[#112f37] sm:text-[52px]">What do we <span className="editorial-highlight">know</span>—and what must we resolve—before this project goes to market?</h1>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-[#596d69] sm:text-base">Define a capital project, separate observed market conditions from the Alberta $50B counterfactual, inspect relevant model paths, and turn evidence gaps into decision gates.</p>
          </div>
          <div className="self-end rounded-2xl border border-[#dfc5b3] border-l-4 border-l-[#d66b35] bg-white px-5 py-4 text-xs leading-5 text-[#774a35] shadow-[0_1px_2px_rgba(13,43,54,0.04)]">
            <span className="font-semibold text-[#984b27]">Decision boundary:</span> AI-attributable cost escalation remains unquantified. No number on this page is an AI cost forecast for the project.
          </div>
          <DecisionSignalRail />
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <ProjectForm
            assetId={assetId} budgetMillions={budgetMillions} duration={duration}
            metroId={metroId} projectName={projectName} setAssetId={setAssetId}
            setBudgetMillions={setBudgetMillions} setDuration={setDuration}
            setMetroId={setMetroId} setProjectName={setProjectName}
            setPriceBasisConfirmed={setPriceBasisConfirmed}
            setSpendProfile={setSpendProfile} setStartYear={setStartYear}
            spendProfile={spendProfile} startYear={startYear}
            priceBasisConfirmed={priceBasisConfirmed}
          />
          <div className="space-y-5">
            <section className="aiio-panel-elevated p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 border-b border-[#dce2dd] pb-5 md:flex-row md:items-start">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#28766d]">Decision boundary brief</p>
                  <h2 className="mt-2 text-2xl font-medium tracking-[-0.025em]">{projectName || 'Untitled project'}</h2>
                  <p className="mt-1 text-sm text-[#62736f]">{analysis.asset.label} · {METROS[metroId]} · ${budgetMillions.toLocaleString()}M · {startYear}–{analysis.endYear}</p>
                </div>
                <Badge variant="outline" className="w-fit border-[#e0ad87] bg-[#fff0e3] text-[#8d471f]">Cost translation unavailable</Badge>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <DecisionMetric evidence="calibration gap" icon={LockKeyhole} label="AI-attributable project cost" note="No defensible dollar or percentage estimate" tone="warning" value="Not quantified" />
                <DecisionMetric evidence="counterfactual scenario" icon={CalendarRange} label="Scenario-window intersection" note={`${analysis.scenarioWindowStart}–${analysis.scenarioWindowEnd} input window; not a forecast`} value={`${analysis.scenarioWindowYears.length} of ${duration} project years`} />
                <DecisionMetric evidence="observed + inferred class" icon={Construction} label="Concurrent public-delivery screen" note="Complete schedules only; simultaneity is not causation" value={`${analysis.concurrentProjectCount} projects`} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1.15fr_.85fr]">
                <div className="rounded-xl border border-[#b8d4cc] bg-[#e8f2ee] p-4 text-sm leading-6 text-[#285d58]">
                  <ShieldCheck className="mr-2 inline size-4 -translate-y-px" />
                  {analysis.scenarioWindowYears.length ? <>
                    The project intersects scenario input years <strong>{formatYears(analysis.scenarioWindowYears)}</strong>.
                    {analysis.dominantPathYears.length ? ` Dominant published path years inside the project are ${formatYears(analysis.dominantPathYears)}.` : ' No dominant published path is available for this outcome; inspect its declared direct parents.'}
                  </> : <>The project is outside the current 2027–2036 scenario input window. That means <strong>not assessed</strong>, not “no risk.”</>}
                </div>
                <div className="rounded-xl border border-[#d8dfda] bg-white p-4 text-[11px] leading-5 text-[#5a6c68]">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#28766d]">Reproducibility</p>
                  <p className="mt-2">Analysis date: {analysis.analysisDate}</p>
                  <p>Scenario: {analysis.scenarioId}</p>
                  <p>Release: {releaseData.manifest.version}</p>
                </div>
              </div>
            </section>
            <ExecutiveDecisionBrief
              analysis={analysis}
              budgetMillions={budgetMillions}
              duration={duration}
              projectName={projectName}
              startYear={startYear}
            />
            <HistoricalMarketEnvelope analysis={analysis} assetId={assetId} duration={duration} />
            <HistoricalAnalogStressTest
              analysis={analysis}
              assetId={assetId}
              budgetMillions={budgetMillions}
              duration={duration}
              priceBasisConfirmed={priceBasisConfirmed}
              spendProfile={spendProfile}
              startYear={startYear}
            />
            <MarketAndPath analysis={analysis} />
            <EvidenceChannels analysis={analysis} />
          </div>
        </div>
      </section>
      <ImpactPathGraph assetLabel={analysis.asset.label} outcomeNodeId={analysis.asset.outcome} />
      <DecisionActions analysis={analysis} />
      <SiteFooter />
    </main>
  );
}

function ExecutiveDecisionBrief({ analysis, budgetMillions, duration, projectName, startYear }: {
  analysis: Analysis; budgetMillions: number; duration: number; projectName: string; startYear: number;
}) {
  const projectLabel = projectName || 'Untitled project';
  const scenarioIntersection = analysis.scenarioWindowYears.length
    ? `${formatYears(analysis.scenarioWindowYears)} (${analysis.scenarioWindowYears.length} of ${duration} delivery years)`
    : 'Outside the current scenario window';
  const lead = analysis.dominantNode?.label ?? 'No ranked pathway';
  const material = analysis.materials[0];
  const labour = analysis.labourRows
    .filter((row) => row.vacancies_per_1_000_2021_employed !== null)
    .sort((left, right) => (right.vacancies_per_1_000_2021_employed ?? 0) - (left.vacancies_per_1_000_2021_employed ?? 0))[0];
  const observedSignal = material
    ? `${COMPONENT_LABELS[material.component] ?? material.component}: ${formatPercent(material.year_over_year_percent_change)} YoY`
    : 'No matching component observation';
  const labourSignal = labour
    ? `${LABOUR_LABELS[labour.trade_node_id] ?? labour.trade_node_id}: ${labour.vacancies_per_1_000_2021_employed?.toFixed(1)}/1k employed`
    : 'No complete matching trade diagnostic';
  return <section className="aiio-panel-elevated overflow-hidden" id="executive-decision-brief">
    <div className="border-b border-[#d8dfda] bg-[#12333d] px-5 py-5 text-white sm:px-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8ed0c5]">Executive decision record · {analysis.analysisDate}</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.025em]">Proceed with gated diligence—not an AI premium.</h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-[#c8d7d8]">The available evidence supports targeted market, procurement and utility diligence. It does not support an AI-attributable escalation percentage, dollar allowance, delay duration or transmission requirement.</p>
        </div>
        <Button className="print-hide shrink-0 border border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => window.print()}>
          <Printer data-icon="inline-start" /> Print brief
        </Button>
      </div>
    </div>
    <div className="p-5 sm:p-7">
      <dl className="grid gap-px overflow-hidden rounded-xl border border-[#d9dfda] bg-[#d9dfda] sm:grid-cols-2 lg:grid-cols-4">
        <BriefFact label="Project" value={projectLabel} note={`${analysis.asset.label} · ${METROS[analysis.metroId]}`} />
        <BriefFact label="Capital decision" value={`$${budgetMillions.toLocaleString()}M`} note={`${startYear}–${analysis.endYear} · ${duration} years`} />
        <BriefFact label="Scenario intersection" value={scenarioIntersection} note="Counterfactual input window—not a forecast" />
        <BriefFact label="AI cost increment" value="Not quantified" note="0 of 8 screened sources qualify" warning />
      </dl>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <BriefColumn eyebrow="Observed now" title="Dated market evidence" tone="teal">
          <BriefLine label="Leading component movement" value={observedSignal} />
          <BriefLine label="Leading complete labour screen" value={labourSignal} />
          <BriefLine label="Concurrent same-class projects" value={`${analysis.concurrentProjectCount} schedule-complete records`} />
        </BriefColumn>
        <BriefColumn eyebrow="Scenario mechanism" title="Path to investigate" tone="blue">
          <BriefLine label="Leading declared node" value={lead} />
          <BriefLine label="Path status" value="Assumed · low confidence" />
          <BriefLine label="Project-specific result" value="Not predicted" />
        </BriefColumn>
        <BriefColumn eyebrow="Unresolved" title="Values that remain withheld" tone="orange">
          <BriefLine label="AI-attributable cost" value="No % or $ estimate" />
          <BriefLine label="Schedule effect" value="No delay-day estimate" />
          <BriefLine label="Power enabling scope" value="Project-specific need unknown" />
        </BriefColumn>
      </div>
      <div className="mt-5 grid gap-4 border-t border-[#dce2dd] pt-5 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#28766d]">Required decision gates</p>
          <ol className="mt-3 grid gap-2 text-xs leading-5 text-[#516660] sm:grid-cols-2">
            <li><strong>01 · Baseline:</strong> retain an independently prepared professional estimate; do not embed an AI premium.</li>
            <li><strong>02 · Market:</strong> test {lead.toLowerCase()} availability, equipment lead times and bid conditions before design freeze.</li>
            <li><strong>03 · Utilities:</strong> confirm connection, enabling-work and interface scope before procurement packaging.</li>
            <li><strong>04 · Refresh:</strong> rerun the dated evidence screen at each estimate and approval gate.</li>
          </ol>
        </div>
        <div className="rounded-lg border border-[#d8dfda] bg-[#f5f6f2] p-4 text-[10px] leading-4 text-[#566963]">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#28766d]">Audit identity</p>
          <p className="mt-2">Release: {releaseData.manifest.version}</p>
          <p>Scenario: {analysis.scenarioId}</p>
          <p>Analysis date: {analysis.analysisDate}</p>
          <p className="mt-2 break-all">Sources: {analysis.sourceIds.join(' · ')}</p>
        </div>
      </div>
    </div>
  </section>;
}

function BriefFact({ label, note, value, warning = false }: { label: string; note: string; value: string; warning?: boolean }) {
  return <div className={`min-w-0 bg-white p-4 ${warning ? 'border-t-2 border-t-[#d66b35]' : 'border-t-2 border-t-[#2f8f83]'}`}><dt className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-[#596a66]">{label}</dt><dd className={`mt-2 text-sm font-semibold ${warning ? 'text-[#9a4a25]' : 'text-[#173e45]'}`}>{value}</dd><dd className="mt-1 text-[9px] leading-4 text-[#596a66]">{note}</dd></div>;
}

function BriefColumn({ children, eyebrow, title, tone }: { children: React.ReactNode; eyebrow: string; title: string; tone: 'teal' | 'blue' | 'orange' }) {
  const styles = tone === 'orange' ? 'border-[#e2b38e] bg-[#fff3e9]' : tone === 'blue' ? 'border-[#b8ccd4] bg-[#eff4f5]' : 'border-[#b9d4cd] bg-[#edf5f1]';
  return <section className={`rounded-xl border p-4 ${styles}`}><p className="font-mono text-[8px] font-semibold uppercase tracking-[0.11em] text-[#60736f]">{eyebrow}</p><h3 className="mt-2 text-sm font-medium">{title}</h3><dl className="mt-4 space-y-3">{children}</dl></section>;
}

function BriefLine({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-black/8 pb-2 last:border-0 last:pb-0"><dt className="text-[9px] leading-4 text-[#586864]">{label}</dt><dd className="mt-0.5 text-xs font-medium leading-5 text-[#234a4e]">{value}</dd></div>;
}

function DecisionSignalRail() {
  const signals = [
    { label: 'Market context', value: 'Available', note: 'Observed + inferred', tone: 'border-t-[#2f8f83]' },
    { label: 'Historical analog', value: 'Available', note: 'Stress test · not forecast', tone: 'border-t-[#57a8b2]' },
    { label: 'Future baseline', value: 'Withheld', note: 'Horizon gate failed', tone: 'border-t-[#d66b35]' },
    { label: 'AI cost increment', value: 'Unquantified', note: '0 of 8 sources qualify', tone: 'border-t-[#d66b35]' },
    { label: 'Graph pathways', value: 'Inspectable', note: 'Assumed · low confidence', tone: 'border-t-[#57a8b2]' },
  ];
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-[#d8dcd7] bg-[#d8dcd7] shadow-[0_1px_2px_rgba(13,43,54,0.035)] sm:grid-cols-2 lg:col-span-2 lg:grid-cols-5" aria-label="Decision readiness signals">
      {signals.map((signal) => (
        <div className={`border-t-2 bg-white px-4 py-3 ${signal.tone}`} key={signal.label}>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.11em] text-[#61736f]">{signal.label}</p>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-[#17343d]">{signal.value}</p>
            <p className="text-right text-[10px] text-[#697a76]">{signal.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

type Analysis = ReturnType<typeof buildDecisionAnalysis>;

function HistoricalMarketEnvelope({ analysis, assetId, duration }: { analysis: Analysis; assetId: AssetId; duration: number }) {
  const referenceClass = ASSET_TO_HISTORICAL_CLASS[assetId];
  const result = historicalEnvelope.reference_class_results.find((item) => item.asset_class === referenceClass && item.geography_id === analysis.metroId);
  const horizon = result?.horizons.find((item) => item.horizon_years === duration);
  if (!referenceClass || !result) {
    return <section className="rounded-xl border border-[#dfb38f] bg-[#fff1e5] p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#93491f]">Historical market envelope</p><h2 className="mt-2 text-xl font-medium text-[#713c24]">No fit-for-purpose building reference</h2></div><Badge variant="outline" className="border-[#dfb38f] text-[#93491f]">not assessed</Badge></div><p className="mt-3 max-w-3xl text-sm leading-6 text-[#7d5946]">The BCPI model-building classes do not represent {analysis.asset.label.toLowerCase()} costs. A building proxy would create false precision, so the historical escalation summary is withheld for this asset.</p></section>;
  }
  if (!horizon) {
    return <section className="rounded-xl border border-[#dfb38f] bg-[#fff1e5] p-5 sm:p-6"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#93491f]">Historical market envelope</p><h2 className="mt-2 text-xl font-medium text-[#713c24]">{duration}-year history not summarized</h2><p className="mt-3 text-sm leading-6 text-[#7d5946]">The governed artifact currently covers one- through five-year windows. This project duration remains outside that descriptive scope.</p></section>;
  }
  const distribution = horizon.historical_cumulative_change_percent;
  const limited = horizon.interpretation_status === 'limited_history_only';
  return <section className={`rounded-xl border p-5 sm:p-6 ${limited ? 'border-[#dfb38f] bg-[#fff8ef]' : 'border-[#b8d4cc] bg-[#edf5f1]'}`}>
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><div className="flex flex-wrap gap-2"><Badge className="border-[#87bfb4] bg-white text-[#155d56]">observed history</Badge><Badge variant="outline" className="border-[#9db7c4] bg-white text-[#365968]">inferred distribution</Badge>{limited ? <Badge variant="outline" className="border-[#dfb38f] bg-[#fff0e3] text-[#93491f]">limited history</Badge> : null}</div><h2 className="mt-3 text-xl font-medium">What did comparable index windows look like historically?</h2><p className="mt-1 text-xs leading-5 text-[#5b6d69]">{result.reference_class_label} · {result.geography_label} · {duration}-year cumulative index change</p></div><span className="font-mono text-[10px] text-[#5b6d69]">through {historicalEnvelope.as_of_date}</span></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <HistoricalMetric label="Historical p10" value={formatPercent(distribution.p10)} note="Lower descriptive marker" />
      <HistoricalMetric label="Historical median" value={formatPercent(distribution.p50)} note={`${formatPercent(horizon.historical_median_annualized_change_percent)} median annualized`} emphasis />
      <HistoricalMetric label="Historical p90" value={formatPercent(distribution.p90)} note="Upper descriptive marker" />
      <HistoricalMetric label="Latest realized window" value={formatPercent(horizon.latest_realized_cumulative_change_percent)} note={`${horizon.latest_window_origin_period_end} to ${horizon.latest_window_target_period_end}`} />
    </div>
    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]"><p className="rounded-lg border border-[#d3ddd7] bg-white p-4 text-xs leading-5 text-[#536863]">Across <strong>{horizon.overlapping_window_count}</strong> overlapping quarterly-origin windows, the middle 80% of realized changes ran from <strong>{formatPercent(distribution.p10)}</strong> to <strong>{formatPercent(distribution.p90)}</strong>. The history spans {horizon.non_overlapping_window_count} non-overlapping windows. Overlap makes the observations serially dependent.</p><div className="rounded-lg border border-[#dfb38f] bg-[#fff0e3] p-4 text-[10px] leading-4 text-[#7d5946] lg:max-w-xs"><strong>Not a forecast or allowance.</strong> These markers are not probabilities and are not multiplied by the project estimate. They contain no AI-attributable increment and do not replace a professional cost plan.</div></div>
    <p className="mt-3 text-[10px] leading-4 text-[#5a6c68]">Proxy status: {result.mapping_status.replaceAll('_', ' ')}. {result.mapping_note}</p>
  </section>;
}

function HistoricalAnalogStressTest({ analysis, assetId, budgetMillions, duration, priceBasisConfirmed, spendProfile, startYear }: {
  analysis: Analysis; assetId: AssetId; budgetMillions: number; duration: number;
  priceBasisConfirmed: boolean; spendProfile: SpendProfileId; startYear: number;
}) {
  const referenceClass = ASSET_TO_HISTORICAL_CLASS[assetId];
  const originYear = Number(historicalAnalogMatrix.as_of_date.slice(0, 4));
  const startLag = startYear - originYear;
  const series = historicalAnalogMatrix.reference_class_results.find(
    (item) => item.asset_class === referenceClass && item.geography_id === analysis.metroId,
  );
  const row = series?.grid.find(
    (item) => item.start_lag_years === startLag
      && item.duration_years === duration
      && item.profile_id === spendProfile,
  );
  if (!referenceClass || !series) {
    return <section className="rounded-xl border border-[#dfb38f] bg-[#fff1e5] p-5 sm:p-6"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#93491f]">Project historical analog</p><h2 className="mt-2 text-xl font-medium text-[#713c24]">No building-market analog for this asset</h2><p className="mt-3 text-sm leading-6 text-[#7d5946]">Road, water and regulated-utility projects need purpose-built civil or utility cost indexes. The product will not translate a building proxy into a dollar stress range.</p></section>;
  }
  if (!row || row.status === 'not_assessed' || !row.schedule_weighted_factor || !row.schedule_weighted_change_percent) {
    return <section className="rounded-xl border border-[#dfb38f] bg-[#fff1e5] p-5 sm:p-6"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#93491f]">Project historical analog</p><h2 className="mt-2 text-xl font-medium text-[#713c24]">Schedule extends beyond the governed analog grid</h2><p className="mt-3 text-sm leading-6 text-[#7d5946]">The current matrix supports expenditure horizons through ten years after the June 2026 price basis. This project reaches {startLag + duration - 1} years after that origin, so no value is shown.</p></section>;
  }
  const factor = row.schedule_weighted_factor;
  const change = row.schedule_weighted_change_percent;
  const estimateCad = budgetMillions * 1_000_000;
  const limited = row.status === 'limited_history_only';
  const budgetValue = (value: number) => priceBasisConfirmed ? formatCad(estimateCad * value) : 'Confirm basis';
  return <section className={`rounded-xl border p-5 sm:p-6 ${limited ? 'border-[#dfb38f] bg-[#fff8ef]' : 'border-[#8fc0b6] bg-[#e9f3ef]'}`}>
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><div className="flex flex-wrap gap-2"><Badge className="border-[#87bfb4] bg-white text-[#155d56]">historical-path stress test</Badge><Badge variant="outline" className="border-[#9db7c4] bg-white text-[#365968]">{SPEND_PROFILE_LABELS[spendProfile]}</Badge>{limited ? <Badge variant="outline" className="border-[#dfb38f] bg-[#fff0e3] text-[#93491f]">limited independent windows</Badge> : null}</div><h2 className="mt-3 text-xl font-medium">What would this expenditure schedule look like under coherent past market paths?</h2><p className="mt-1 text-xs leading-5 text-[#5b6d69]">{series.reference_class_label} · {series.geography_label} · expenditure horizons {startLag}–{startLag + duration - 1} years from {historicalAnalogMatrix.as_of_date}</p></div><span className="font-mono text-[10px] text-[#5b6d69]">{row.overlapping_trajectory_count} historical origins</span></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <AnalogMetric label="Lower historical marker" value={formatPercent(change.p10)} budget={budgetValue(factor.p10)} />
      <AnalogMetric label="Median historical marker" value={formatPercent(change.p50)} budget={budgetValue(factor.p50)} emphasis />
      <AnalogMetric label="Upper historical marker" value={formatPercent(change.p90)} budget={budgetValue(factor.p90)} />
    </div>
    <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-lg border border-[#d3ddd7] bg-white p-4 text-xs leading-5 text-[#536863]"><p><strong>Schedule logic:</strong> the {SPEND_PROFILE_LABELS[spendProfile].toLowerCase()} profile shares are applied to each complete historical index trajectory, preserving the relationship among years instead of mixing independent horizon quantiles.</p><p className="mt-2">The history spans only <strong>{row.non_overlapping_trajectory_count}</strong> non-overlapping schedule-length windows; overlapping origins are serially dependent.</p></div>
      <div className="rounded-lg border border-[#dfb38f] bg-[#fff0e3] p-4 text-[10px] leading-4 text-[#7d5946]"><strong>Not a forecast, probability range or recommended contingency.</strong> Dollar equivalents appear only after confirming the estimate is in the June 2026 price basis and excludes escalation. No AI increment or graph score is added.</div>
    </div>
    <p className="mt-3 text-[10px] leading-4 text-[#5a6c68]">Proxy status: {series.mapping_status.replaceAll('_', ' ')}. {series.mapping_note}</p>
  </section>;
}

function AnalogMetric({ budget, emphasis = false, label, value }: { budget: string; emphasis?: boolean; label: string; value: string }) {
  return <article className={`rounded-lg border bg-white p-4 ${emphasis ? 'border-[#6da99f]' : 'border-[#d3ddd7]'}`}><p className="font-mono text-xl font-semibold text-[#1f625b]">{value}</p><p className="mt-2 text-xs font-medium">{label}</p><p className="mt-2 border-t border-[#e0e6e1] pt-2 font-mono text-sm text-[#365f5b]">{budget}</p><p className="mt-1 text-[9px] uppercase tracking-[0.07em] text-[#697975]">historical analog budget equivalent</p></article>;
}

function HistoricalMetric({ emphasis = false, label, note, value }: { emphasis?: boolean; label: string; note: string; value: string }) {
  return <article className={`rounded-lg border bg-white p-4 ${emphasis ? 'border-[#6da99f]' : 'border-[#d3ddd7]'}`}><p className="font-mono text-xl font-semibold text-[#1f625b]">{value}</p><p className="mt-2 text-xs font-medium">{label}</p><p className="mt-1 text-[10px] leading-4 text-[#5a6c68]">{note}</p></article>;
}

function ProjectForm({ assetId, budgetMillions, duration, metroId, priceBasisConfirmed, projectName, setAssetId, setBudgetMillions, setDuration, setMetroId, setPriceBasisConfirmed, setProjectName, setSpendProfile, setStartYear, spendProfile, startYear }: {
  assetId: AssetId; budgetMillions: number; duration: number; metroId: MetroId; projectName: string;
  priceBasisConfirmed: boolean; spendProfile: SpendProfileId;
  setAssetId: (value: AssetId) => void; setBudgetMillions: (value: number) => void;
  setDuration: (value: number) => void; setMetroId: (value: MetroId) => void;
  setPriceBasisConfirmed: (value: boolean) => void; setProjectName: (value: string) => void;
  setSpendProfile: (value: SpendProfileId) => void; setStartYear: (value: number) => void; startYear: number;
}) {
  return <aside className="aiio-panel-elevated self-start p-5 xl:sticky xl:top-24">
    <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#28766d]">Project definition</p><h2 className="mt-1 text-lg font-medium">Your capital decision</h2></div><Building2 className="size-5 text-[#2b776e]" /></div>
    <div className="mt-6 space-y-5">
      <Field label="Project name"><Input className="aiio-control h-10" onChange={(event) => setProjectName(event.target.value)} value={projectName} /></Field>
      <Field label="Asset class"><NativeSelect className="w-full [&>select]:h-10 [&>select]:border-[#d8dcd7] [&>select]:bg-[#f8f8f4] [&>select]:hover:border-[#aebdb7] [&>select]:hover:bg-white" onChange={(event) => setAssetId(event.target.value as AssetId)} value={assetId}>{Object.entries(ASSETS).map(([id, asset]) => <NativeSelectOption key={id} value={id}>{asset.label}</NativeSelectOption>)}</NativeSelect></Field>
      <Field label="Market region"><NativeSelect className="w-full [&>select]:h-10 [&>select]:border-[#d8dcd7] [&>select]:bg-[#f8f8f4] [&>select]:hover:border-[#aebdb7] [&>select]:hover:bg-white" onChange={(event) => setMetroId(event.target.value as MetroId)} value={metroId}>{Object.entries(METROS).map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect><p className="text-[10px] leading-4 text-[#596b67]">Full decision analysis is currently available for Alberta.</p></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Estimate ($M)"><Input className="aiio-control h-10 font-mono" min="1" onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setBudgetMillions(Math.max(1, value)); }} type="number" value={budgetMillions} /></Field>
        <Field label="Start year"><Input className="aiio-control h-10 font-mono" max="2040" min="2026" onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setStartYear(value); }} type="number" value={startYear} /></Field>
      </div>
      <Field label="Annual expenditure shape"><NativeSelect className="w-full [&>select]:h-10 [&>select]:border-[#d8dcd7] [&>select]:bg-[#f8f8f4] [&>select]:hover:border-[#aebdb7] [&>select]:hover:bg-white" onChange={(event) => setSpendProfile(event.target.value as SpendProfileId)} value={spendProfile}>{Object.entries(SPEND_PROFILE_LABELS).map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect><p className="text-[10px] leading-4 text-[#596b67]">A declared stress-test schedule—not an inferred project cash flow.</p></Field>
      <label className="flex cursor-pointer gap-3 rounded-lg border border-[#d8dfda] bg-[#f7f8f4] p-3 text-[11px] leading-5 text-[#52645f]"><input checked={priceBasisConfirmed} className="mt-1 size-4 accent-[#28766d]" onChange={(event) => setPriceBasisConfirmed(event.target.checked)} type="checkbox" /><span>The estimate is stated in the June 2026 price basis and excludes future escalation already embedded elsewhere.</span></label>
      <p className="-mt-3 text-[10px] leading-4 text-[#596b67]">The estimate enters only the historical analog stress test after this basis is confirmed. It never enters the uncalibrated AI scenario.</p>
      <Field label={`Delivery duration · ${duration} years`}><input aria-label="Delivery duration in years" className="scenario-range mt-2 w-full" max="10" min="2" onChange={(event) => setDuration(Number(event.target.value))} type="range" value={duration} /><div className="flex justify-between font-mono text-[10px] text-[#5a6c68]"><span>2 years</span><span>10 years</span></div></Field>
    </div>
  </aside>;
}

function MarketAndPath({ analysis }: { analysis: Analysis }) {
  const composite = analysis.marketComposite;
  return <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
    <div className="rounded-xl border border-[#cbd5cf] bg-[#fbfaf5] p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><Badge className="border-[#87bfb4] bg-[#e1f1ec] text-[#155d56]">observed index</Badge><Badge variant="outline" className="border-[#9db7c4] bg-[#e9f0f3] text-[#365968]">inferred change</Badge></div><h2 className="mt-3 text-lg font-medium">Dated market screen</h2></div><span className="font-mono text-[10px] text-[#5b6d69]">{releaseData.material_cost_screen.period_end} · STATCAN_BCPI_18100289</span></div>
      <div className="mt-5 rounded-lg border border-[#d8dfda] bg-white p-4"><p className="font-mono text-2xl font-semibold text-[#225f59]">{composite ? composite.value.toFixed(1) : 'Unavailable'}</p><p className="mt-1 text-xs font-medium">{composite?.indicator_id.includes('SCHOOL') ? 'School' : 'Non-residential'} division composite</p><p className="mt-1 text-[10px] leading-4 text-[#5a6c68]">{composite ? `${formatPercent(composite.quarter_over_quarter_percent)} quarter over quarter · index 2023=100` : 'No matching composite in this release'}</p></div>
      <div className="mt-5 space-y-3">{analysis.materials.map((item) => { const value = item.year_over_year_percent_change; const rising = value >= 0; return <div className="flex items-center justify-between gap-3 border-b border-[#e0e5e1] pb-3 last:border-0" key={item.indicator_id}><span className="text-xs">{COMPONENT_LABELS[item.component] ?? item.component}</span><span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${rising ? 'text-[#225f59]' : 'text-[#9a4a25]'}`}>{rising ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}{formatPercent(value)} YoY</span></div>; })}</div>
      <p className="mt-4 text-[11px] leading-5 text-[#5a6c68]">Proxy: {analysis.asset.proxy}. {analysis.asset.profileNote}</p>
    </div>
    <div className="rounded-xl border border-[#dfb38f] bg-[#fff1e5] p-5 sm:p-6">
      <div className="flex items-center gap-2 text-[#93491f]"><Network className="size-4" /><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">Assumed counterfactual path</p></div>
      <h2 className="mt-3 text-xl font-medium text-[#713c24]">Model pathway to inspect: {analysis.dominantNode?.label ?? 'No ranked node'}</h2>
      <p className="mt-3 text-sm leading-6 text-[#7d5946]">{analysis.leadingPath}. This is an assumed, low-confidence structural mechanism—not an observed shortage, causal finding, or prediction for this project.</p>
      <p className="mt-4 text-xs leading-5 text-[#744d39]">{analysis.dominantPaths.length ? `The release publishes ${analysis.dominantPaths.length} dominant path records for this outcome inside the project window.` : 'The release has no dominant-path record for this outcome inside the project window; the label uses the highest central-weight direct parent in the declared graph.'}</p>
      <Button className="mt-5 bg-[#8c4928] text-white hover:bg-[#71391f]" onClick={() => document.querySelector('#dependency-graph')?.scrollIntoView({ behavior: 'smooth' })}>Inspect the declared graph <ArrowRight data-icon="inline-end" /></Button>
    </div>
  </section>;
}

function EvidenceChannels({ analysis }: { analysis: Analysis }) {
  const power = analysis.powerEvidence;
  const macro = Object.fromEntries(
    regionalMacroControls.latest_alberta_controls.map((item) => [item.indicator_id, item]),
  );
  const macroRows = [
    ['All-items CPI', macro.MACRO_CPI_ALL_ITEMS_QAVG],
    ['Shelter CPI', macro.MACRO_CPI_SHELTER_QAVG],
    ['Construction earnings', macro.MACRO_WEEKLY_EARNINGS_CONSTRUCTION_QAVG],
    ['Population', macro.MACRO_POPULATION_QUARTERLY],
    ['Housing starts', macro.MACRO_HOUSING_STARTS_SAAR_QAVG],
    ['Non-residential investment', macro.MACRO_NON_RESIDENTIAL_BUILDING_INVESTMENT_QSUM],
  ] as const;
  return <section className="rounded-xl border border-[#cbd5cf] bg-[#edf0ea] p-5 sm:p-6">
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#28766d]">Four-channel evidence check</p><h2 className="mt-2 text-xl font-medium">Do not let one signal stand in for the system.</h2></div><span className="font-mono text-[9px] text-[#5a6c68]">as of {analysis.analysisDate}</span></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      <ChannelCard icon={Users} title="Labour screen" status="inferred diagnostic">{analysis.labourRows.length ? <ul className="space-y-1.5">{analysis.labourRows.map((row) => <li className="flex justify-between gap-3" key={row.trade_node_id}><span>{LABOUR_LABELS[row.trade_node_id]}</span><span className="font-mono font-semibold">{row.vacancies_per_1_000_2021_employed === null ? 'not published' : `${row.vacancies_per_1_000_2021_employed.toFixed(1)}/1k`}</span></li>)}</ul> : 'No matching complete labour diagnostic.'}</ChannelCard>
      <ChannelCard icon={Construction} title="Public delivery" status="observed + research candidate">{analysis.concurrentProjectCount} same-class Alberta records with complete schedules overlap this project window. The full Alberta class inventory has {analysis.publicAssetSummary?.project_count ?? 0} records. Separately, {auditedProjectOutcomes.coverage_summary.named_completed_project_count} audited Ontario cases and a Québec panel with {quebecProjectRevisions.coverage_summary.cost_revision_chain_reconciled_project_count} authorized-cost chains, {quebecProjectRevisions.coverage_summary.schedule_revision_chain_reconciled_project_count} completion-month chains and {quebecFullArchive.publisher_declared_retirement_disappearance_event_count} source-declared retirement transitions inform reference design. Those transitions are not audited completions, and neither source authorizes an AI effect or a transfer factor for this project.</ChannelCard>
      <ChannelCard icon={Zap} title="Power system" status="observed · separate MW channel">AESO reported {(power.requested_load.latest_requested_load_mw / 1000).toFixed(1)} GW requested in {power.requested_load.latest_application_period}; Phase 1 allocation is {(power.phase1.allocated_mw / 1000).toFixed(1)} GW. Project-specific transmission need is unknown.</ChannelCard>
      <ChannelCard icon={Factory} title="Regional macro context" status="descriptive controls · 2026 Q2">
        <ul className="grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
          {macroRows.map(([label, item]) => <li className="flex justify-between gap-3 border-b border-[#e3e6e1] pb-1.5" key={label}><span>{label}</span><span className="font-mono font-semibold text-[#275f5a]">{formatMacroChange(item?.year_over_year_change_percent)}</span></li>)}
        </ul>
        <p className="mt-3 text-[10px] leading-4">Separate Statistics Canada controls—not a composite pressure score, AI effect, project escalation forecast or scenario calibration.</p>
      </ChannelCard>
    </div>
    <p className="mt-4 text-[10px] leading-4 text-[#5a6c68]">Labour is vacancies per 1,000 people employed in the 2021 Census and is not StatCan&apos;s vacancy rate or spare capacity. Requested power load is not contracted, connected or forecast load. Concurrent projects show timing overlap, not competition or causation.</p>
  </section>;
}

function DecisionActions({ analysis }: { analysis: Analysis }) {
  const lead = analysis.dominantNode?.label ?? 'leading trade';
  const actions = [
    { timing: 'Before design freeze', title: `Test the ${lead.toLowerCase()} market`, text: 'Request market soundings that separate labour availability, equipment lead times and bid-price movement. Compare them with the incomplete-data flags above.' },
    { timing: 'Before budget submission', title: 'Keep market baseline and AI increment separate', text: 'Use a professionally prepared baseline estimate. Hold any AI-attributable allowance as an unresolved risk until the translation layer passes calibration review.' },
    { timing: 'Before procurement packaging', title: 'Validate utility dependencies', text: 'Confirm connection scope, enabling works and schedule interfaces. The current evidence cannot infer project-specific transmission or distribution needs.' },
    { timing: 'At each estimate gate', title: 'Re-run the dated evidence screen', text: `Refresh the ${METROS[analysis.metroId]} material, labour and public-project signals through ${analysis.scenarioWindowYears.length ? formatYears(analysis.scenarioWindowYears) : 'the applicable delivery window'}.` },
  ];
  return <section className="bg-[#f7f6f1]"><div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
    <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#28766d]">Decision actions</p><h2 className="mt-3 text-3xl font-medium tracking-[-0.035em]">Turn evidence into a gate, not a guess.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[#5c706b]">The evidence can change diligence and sequencing today. It cannot yet produce an AI-specific dollar contingency.</p><div className="mt-6 grid gap-2 text-xs"><CoverageRow label="Observed market screen" status="Available" /><CoverageRow label="Historical index envelope" status="Available · descriptive" /><CoverageRow label="Regional macro context" status="Available · descriptive" /><CoverageRow label="Structural pathway" status="Assumed · low confidence" /><CoverageRow label="Project cost translation" status="Calibration pending" warning /><CoverageRow label="AI macro spillover" status="Calibration pending" warning /></div></div>
      <ol className="grid gap-3 sm:grid-cols-2">{actions.map((action, index) => <li className="rounded-xl border border-[#ced8d1] bg-[#fbfaf5] p-5" key={action.title}><div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] font-semibold text-[#28766d]">0{index + 1}</span><span className="rounded-full bg-[#e5efeb] px-2 py-1 text-[9px] font-medium text-[#285d58]">{action.timing}</span></div><h3 className="mt-5 font-medium">{action.title}</h3><p className="mt-2 text-xs leading-5 text-[#62736f]">{action.text}</p></li>)}</ol>
    </div>
    <div className="mt-8 flex flex-col justify-between gap-4 rounded-xl border border-[#cbd5cf] bg-[#e8ece7] p-5 sm:flex-row sm:items-center"><div className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-[#28766d]" /><div><p className="max-w-3xl text-xs leading-5 text-[#576c67]">Research Mode provides the evidence register, assumptions, uncertainty, source links and downloads. Source IDs used here:</p><p className="mt-1 break-all font-mono text-[9px] leading-4 text-[#5a6c68]">{analysis.sourceIds.join(' · ')}</p></div></div><Link className="shrink-0 text-xs font-semibold text-[#1c665f] hover:underline" href="/research">Open Research Mode →</Link></div>
  </div></section>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) { return <label className="block"><span className="mb-2 block text-xs font-medium text-[#4f625e]">{label}</span>{children}</label>; }
function DecisionMetric({ evidence, icon: Icon, label, note, tone = 'default', value }: { evidence: string; icon: typeof LockKeyhole; label: string; note: string; tone?: 'default' | 'warning'; value: string }) { return <article className={`rounded-xl border p-4 ${tone === 'warning' ? 'border-[#e1b28d] bg-[#fff3e9]' : 'border-[#d7dfda] bg-white'}`}><div className="flex items-center justify-between gap-2"><Icon className={`size-4 ${tone === 'warning' ? 'text-[#a04f27]' : 'text-[#2b776e]'}`} /><span className="font-mono text-[8px] uppercase tracking-[0.08em] text-[#5a6b67]">{evidence}</span></div><p className="mt-4 font-mono text-lg font-semibold leading-6 text-[#183e45]">{value}</p><p className="mt-2 text-xs font-medium">{label}</p><p className="mt-1 text-[10px] leading-4 text-[#5a6b67]">{note}</p></article>; }
function ChannelCard({ children, icon: Icon, status, title, warning = false }: { children: React.ReactNode; icon: typeof Users; status: string; title: string; warning?: boolean }) { return <article className={`rounded-xl border p-4 ${warning ? 'border-[#dfb38f] bg-[#fff1e5]' : 'border-[#d5ddd8] bg-[#fbfaf5]'}`}><div className="flex items-center justify-between gap-2"><Icon className="size-4 text-[#28766d]" /><span className="font-mono text-[8px] uppercase text-[#5a6c68]">{status}</span></div><h3 className="mt-4 text-sm font-medium">{title}</h3><div className="mt-2 text-[11px] leading-5 text-[#5a6c68]">{children}</div></article>; }
function CoverageRow({ label, status, warning = false }: { label: string; status: string; warning?: boolean }) { return <div className="flex items-center justify-between gap-4 border-b border-[#d6ded9] py-2 last:border-0"><span className="text-[#52645f]">{label}</span><span className={`font-mono text-[10px] font-semibold ${warning ? 'text-[#a04f27]' : 'text-[#28766d]'}`}>{status}</span></div>; }
function formatPercent(value: number) { return Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : 'n/a'; }
function formatCad(value: number) { if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`; if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`; return new Intl.NumberFormat('en-CA', { currency: 'CAD', maximumFractionDigits: 0, style: 'currency' }).format(value); }
function formatMacroChange(value: number | null | undefined) { return value === null || value === undefined || !Number.isFinite(value) ? 'not published' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}% YoY`; }
function formatYears(years: number[]) { if (!years.length) return 'none'; if (years.length === 1) return String(years[0]); const consecutive = years.every((year, index) => index === 0 || year === years[index - 1] + 1); return consecutive ? `${years[0]}–${years.at(-1)}` : years.join(', '); }
