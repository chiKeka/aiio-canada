'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  CircleCheck,
  ChevronRight,
  Clock3,
  Database,
  GitBranch,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import releaseData from '@/public/data/latest.json';
import { ModeToggle } from '@/components/mode-toggle';
import { boundedDisplayScore } from '@/lib/decision-analysis';

const tradeTones = ['bg-[#d66b35]', 'bg-[#e6a64c]', 'bg-[#2f8f83]', 'bg-[#6b8798]'];

const researchLayers = [
  {
    icon: Database,
    title: 'Evidence pipeline',
    text: 'Capex announcements, construction costs, labour-demand signals, workforce stock and power scenarios—with source and retrieval history.',
  },
  {
    icon: GitBranch,
    title: 'Propagation engine',
    text: 'A signed, typed graph traces demand through trades, building materials, construction-cost signals and public-delivery pressure.',
  },
  {
    icon: Activity,
    title: 'Scenario laboratory',
    text: 'Test investment size, timing and composition without presenting scenarios as forecasts.',
  },
];

const provincialCoverage = [
  {
    province: 'Alberta',
    role: 'Published pilot',
    layers: ['Pilot release', 'Pilot release', 'Pilot release', 'Observed screen'],
  },
  {
    province: 'British Columbia',
    role: 'Expansion intake',
    layers: ['Source locked', 'Reference ready', 'Common signal', 'Source contract'],
  },
  {
    province: 'Ontario',
    role: 'Expansion intake',
    layers: ['Source locked', 'Reference ready', 'Common signal', 'Source contract'],
  },
  {
    province: 'Quebec',
    role: 'Expansion intake',
    layers: ['Source locked', 'Reference ready', 'Common signal', 'Source contract'],
  },
];

const coverageColumns = ['Public projects', 'Cost reference', 'Trade labour', 'Power planning'];

export function ObservatoryDashboard() {
  const [capex, setCapex] = useState(50);
  const [years, setYears] = useState(10);

  const scenario = useMemo(() => {
    const annual = capex / years;
    const localConstruction = capex * releaseData.scenario.modelled_component_share * releaseData.scenario.local_capture_share;
    const outsideGraph = capex * (1 - releaseData.scenario.modelled_component_share);
    const scale = (capex / 50) * (10 / years);
    const baseRawPressure = Math.max(
      ...releaseData.scenario.trade_pressure_order.map(
        (trade) => (trade as typeof trade & { raw_central?: number }).raw_central ?? trade.central,
      ),
    );

    return {
      annual,
      localConstruction,
      outsideGraph,
      scale,
      pressure: boundedDisplayScore(baseRawPressure * scale),
    };
  }, [capex, years]);

  const tradeMix = releaseData.scenario.trade_pressure_order.slice(0, 4).map((trade, index) => ({
    name: trade.label,
    rawScore: (trade as typeof trade & { raw_central?: number }).raw_central ?? trade.central,
    tone: tradeTones[index],
  }));
  const maxTradeScore = Math.max(
    ...tradeMix.map((trade) => boundedDisplayScore(trade.rawScore * scenario.scale)),
    0.01,
  );

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-[#e2e0d9] bg-[#faf9f5]/95 text-[#172f35] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link className="group flex items-center gap-3" href="/research" aria-label="AIIO Canada research home">
            <span className="grid size-9 place-items-center rounded-full border border-[#bdd5ce] bg-white font-mono text-xs font-semibold text-[#17665f] shadow-[0_1px_2px_rgba(18,53,52,.06)]">
              AI
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.02em]">AIIO Canada</span>
              <span className="hidden text-[9px] uppercase tracking-[0.16em] text-[#536864] sm:block">
                Infrastructure impact observatory
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-5 text-xs font-medium text-[#62716e] md:flex" aria-label="Primary navigation">
            <Link className="transition-colors hover:text-[#143f42]" href="/evidence">Evidence</Link>
            <Link className="transition-colors hover:text-[#143f42]" href="/pressure">Pressure monitor</Link>
            <Link className="transition-colors hover:text-[#143f42]" href="/scenario">Scenario lab</Link>
            <Link className="transition-colors hover:text-[#143f42]" href="/methods">Methods</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle compact />
            <Link
              className="hidden h-8 items-center gap-1.5 rounded-full border border-[#d5d9d4] bg-white px-3 text-xs font-medium text-[#294a49] shadow-[0_1px_2px_rgba(18,53,52,.05)] transition-colors hover:border-[#9ebeb6] hover:bg-[#f3f8f6] sm:inline-flex"
              href="/evidence"
            >
              Evidence register <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section id="top" className="relative border-b border-[#e2e0d9] bg-[#faf9f5]">
        <div className="observatory-grid absolute inset-0 opacity-65" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(390px,.8fr)] lg:px-12 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#d7a47f] bg-[#fff0e4] px-3 py-2 text-xs font-semibold text-[#8d421e] lg:col-span-2">
            <AlertTriangle className="size-4" /> Counterfactual structural diagnostic · not a finding or forecast
          </div>
          <div className="max-w-4xl">
            <div className="mb-7 flex flex-wrap items-center gap-2">
              <Badge className="border-[#2f8f83]/30 bg-[#dff0eb] text-[#175e56]">Alberta pilot</Badge>
              <Badge variant="outline" className="border-[#bdc9c3] bg-white/65 text-[#4c625f]">Release {releaseData.manifest.version}</Badge>
              <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-[#526560]">
                <span className="size-1.5 rounded-full bg-[#2f8f83]" /> Canada expansion plan documented
              </span>
            </div>
            <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#30786e]">
              Framing question
            </p>
            <h1 className="max-w-[950px] text-balance font-heading text-[clamp(2.5rem,5.4vw,5.35rem)] font-normal leading-[0.98] tracking-[-0.055em] text-[#0c2935]">
              Where could AI capital spending create <span className="editorial-highlight">pressure</span> on public infrastructure delivery?
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-[#49605f] sm:text-lg">
              An uncalibrated research prototype for testing possible mechanisms through labour, materials and project schedules—beginning in Alberta, then expanding across Canada. It does not measure realized effects.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" className="h-11 bg-[#0d5760] px-4 text-white hover:bg-[#174750]" onClick={() => document.querySelector('#scenario')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Alberta scenario <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" className="h-11 border-[#b7c5c0] bg-white/70 px-4 text-[#294b4c]" onClick={() => document.querySelector('#method')?.scrollIntoView({ behavior: 'smooth' })}>
                Read the research method
              </Button>
            </div>
          </div>

          <Card id="scenario" className="self-end border-[#bdc8c1] bg-[#fbfaf5]/95 shadow-[0_26px_80px_rgba(14,44,53,.12)] ring-0">
            <CardHeader className="border-b border-[#dde2dc] pb-4">
              <CardTitle className="flex items-center gap-2 text-[#102f39]">
                <Sparkles className="size-4 text-[#c05f32]" /> Alberta counterfactual sandbox
              </CardTitle>
              <CardDescription>Explore a linear interface interpolation of the published $50B diagnostic.</CardDescription>
              <CardAction>
                <Badge variant="outline" className="border-[#d8a98e] bg-[#fff3e8] text-[#994a25]">Uncalibrated · not a forecast</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-7 pt-1">
              <label className="block">
                <span className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-[#596a67]">
                  AI infrastructure investment
                  <output className="font-mono text-base tracking-normal text-[#0e5960]">${capex}B</output>
                </span>
                <input
                  aria-label="AI infrastructure investment in billions of dollars"
                  className="scenario-range w-full"
                  max="100"
                  min="10"
                  onChange={(event) => setCapex(Number(event.target.value))}
                  step="5"
                  type="range"
                  value={capex}
                />
                <span className="mt-2 flex justify-between font-mono text-[10px] text-[#7a8a86]"><span>$10B</span><span>$100B</span></span>
              </label>
              <div>
                <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.08em] text-[#596a67]">Delivery window</span>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((option) => (
                    <button
                      aria-pressed={years === option}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${years === option ? 'border-[#236d68] bg-[#dceee8] text-[#15564f]' : 'border-[#d6ddd8] bg-white text-[#64736f] hover:border-[#9fb4ac]'}`}
                      key={option}
                      onClick={() => setYears(option)}
                      type="button"
                    >
                      {option} years
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-[#e2e5df] pt-5">
                <Metric label="Annual flow" value={`$${scenario.annual.toFixed(1)}B`} />
                <Metric label="Local build flow" value={`$${scenario.localConstruction.toFixed(1)}B`} />
                <Metric label="Outside graph" value={`$${scenario.outsideGraph.toFixed(1)}B`} />
              </div>
            </CardContent>
            <CardFooter className="border-[#e1e3dc] bg-[#f1efe6] text-xs leading-5 text-[#61706d]">
              Controls are an interface interpolation, not a new model run. Scores are bounded display indices—not percentages, probabilities, measured effects or delay estimates. The power overlay is kept separate in the Scenario Lab.
            </CardFooter>
          </Card>
        </div>
      </section>

      <section id="pressure" className="aiio-command-grid text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#83cbbf]">Propagation preview</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-medium tracking-[-0.035em] sm:text-4xl">Follow pressure from investment to public delivery.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#aabec4]">
              The graph is the analysis engine: each link has a mechanism, direction, time lag, geography and evidence grade.
            </p>
          </div>

          <div className="grid gap-6 py-8 lg:grid-cols-[1.1fr_.9fr]">
            <div className="grid min-h-[320px] grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-xl border border-white/10 bg-[#0f3341] p-5 sm:p-8">
              <FlowNode icon={Building2} eyebrow="Shock" label={`$${capex}B AI capex`} />
              <FlowArrow />
              <FlowNode icon={Zap} eyebrow="Constraint" label="Trades + materials" active />
              <FlowArrow />
              <FlowNode icon={Clock3} eyebrow="Exposure" label="Public schedules" />
            </div>

            <Card className="border-white/10 bg-[#102f3a] text-white ring-0">
              <CardHeader>
                <CardTitle>Illustrative trade pressure</CardTitle>
                <CardDescription className="text-[#9eb4bb]">Relative signal under the selected scenario</CardDescription>
                <CardAction><span className="font-mono text-xs text-[#f0b06c]">score {scenario.pressure.toFixed(2)}</span></CardAction>
              </CardHeader>
              <CardContent className="space-y-5">
                {tradeMix.map((trade, index) => {
                  const displayed = boundedDisplayScore(trade.rawScore * scenario.scale);
                  const scaled = Math.min(98, Math.round((displayed / maxTradeScore) * 100));
                  return (
                    <div key={trade.name}>
                      <div className="mb-2 flex justify-between text-xs"><span className="text-[#d4e0e3]">{trade.name}</span><span className="font-mono text-[#8faab2]">0{index + 1}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/8"><div className={`h-full rounded-full ${trade.tone}`} style={{ width: `${scaled}%` }} /></div>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter className="border-white/10 bg-white/4 text-xs text-[#98adb3]">Published v0.2 ordering is an uncalibrated structural diagnostic. Weights, retention and denominators remain assumptions pending occupational calibration.</CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <section id="method" className="bg-[#f5f3ec]">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <div className="flex items-center gap-2 text-[#176a64]"><ShieldCheck className="size-4" /><span className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">Research architecture</span></div>
              <h2 className="mt-4 text-4xl font-medium tracking-[-0.045em] text-[#0d2b36]">One observatory.<br />Three connected layers.</h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-[#5a6b68]">The website and workbook are publication surfaces. The underlying source register, graph model and scenario protocol remain the system of record.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {researchLayers.map((layer, index) => (
                <Card key={layer.title} className="border-[#d7ddd7] bg-[#fbfaf5] ring-0">
                  <CardHeader>
                    <span className="mb-6 grid size-10 place-items-center rounded-full bg-[#e2efeb] text-[#176a64]"><layer.icon className="size-4" /></span>
                    <p className="font-mono text-[10px] text-[#52645f]">0{index + 1}</p>
                    <CardTitle className="text-[#183640]">{layer.title}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-sm leading-6 text-[#667571]">{layer.text}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="canada-coverage" className="border-y border-[#d7ddd8] bg-[#f0efe8]">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-[#28766d]">Canada expansion map</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-medium tracking-[-0.04em] text-[#0d2b36] sm:text-4xl">Coverage first. Comparison only when the quantities agree.</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-[#5b6d69]">This matrix shows research readiness, not provincial performance. Expansion-source records remain outside Decision Mode until their validation and review gates pass.</p>
          </div>

          <div className="mt-9 overflow-hidden rounded-xl border border-[#cdd5d0] bg-[#fbfaf5] shadow-[0_16px_45px_rgba(21,55,55,.06)]">
            <p className="border-b border-[#d8ddd8] bg-white px-4 py-3 font-mono text-[9px] uppercase tracking-[0.08em] text-[#687a75] sm:hidden">Swipe horizontally to inspect all evidence layers</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <caption className="sr-only">Research evidence coverage by province and evidence layer</caption>
                <thead>
                  <tr className="border-b border-[#d8ddd8] bg-[#e7ebe6] font-mono text-[10px] uppercase tracking-[0.1em] text-[#405652]">
                    <th className="px-5 py-4 font-semibold" scope="col">Province</th>
                    {coverageColumns.map((column) => <th className="px-4 py-4 font-semibold" key={column} scope="col">{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {provincialCoverage.map((row) => (
                    <tr className="border-b border-[#e0e4df] last:border-0" key={row.province}>
                      <th className="px-5 py-5" scope="row">
                        <span className="block text-sm font-semibold text-[#153941]">{row.province}</span>
                        <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.08em] text-[#536662]">{row.role}</span>
                      </th>
                      {row.layers.map((status, index) => <td className="px-4 py-5" key={`${row.province}-${coverageColumns[index]}`}><CoverageStatus status={status} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#d8ddd8] bg-white px-5 py-4 font-mono text-[9px] uppercase tracking-[0.07em] text-[#60716d]">
              <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#2f8f83]" /> Published pilot layer</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#6b8798]" /> Common national/provincial signal</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#d66b35]" /> Locked intake · review pending</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-[#bed3cb] bg-[#e5f1ed] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[#17645d]"><CircleCheck className="size-4" /><h3 className="text-sm font-semibold">Comparable now</h3></div>
              <p className="mt-3 text-sm leading-6 text-[#4f6964]">Coverage status, source vintage, within-publisher scenario spread, and like-for-like quantities with aligned units, periods and system boundaries.</p>
            </article>
            <article className="rounded-xl border border-[#dfb18f] bg-[#fff0e4] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[#96502d]"><LockKeyhole className="size-4" /><h3 className="text-sm font-semibold">Held behind the gate</h3></div>
              <p className="mt-3 text-sm leading-6 text-[#755d4f]">Ontario data-centre energy versus Quebec winter peak, B.C. supply actions as spare capacity, or any conversion of province-wide capex into a transmission build requirement.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="evidence" className="border-y border-[#dae0db] bg-[#ebece6]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_auto] lg:px-12">
          <div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#1a6d66]"><BookOpen className="size-4" /></span><div><p className="text-lg font-medium text-[#14323d]">{releaseData.baseline.ai_project_pipeline.core_project_count} core data-centre records are in the current Alberta evidence view.</p><p className="mt-1 max-w-2xl text-sm leading-6 text-[#52645f]">Projects with reported values total ${(releaseData.baseline.ai_project_pipeline.known_core_capex_cad / 1_000_000_000).toFixed(2)}B, but these are announcements—not commitments or realized spend. The weekly digest feeds review, never the model automatically.</p></div></div>
          <div className="flex items-center gap-3 lg:justify-end"><MapPin className="size-4 text-[#c05f32]" /><span className="font-mono text-xs text-[#5a6b68]">PILOT: ALBERTA · SCALE: CANADA</span></div>
        </div>
      </section>

      <footer className="bg-[#081e28] text-[#9db0b7]">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 px-5 py-8 text-xs sm:px-8 md:flex-row md:items-center lg:px-12">
          <p>AI Infrastructure Impact Observatory Canada · Public research in development</p>
          <p className="font-mono">Observed ≠ inferred ≠ assumed ≠ scenario</p>
        </div>
      </footer>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="font-mono text-lg font-semibold text-[#133c44]">{value}</p><p className="mt-1 text-[10px] leading-4 text-[#74827e]">{label}</p></div>;
}

function FlowNode({ active, eyebrow, icon: Icon, label }: { active?: boolean; eyebrow: string; icon: typeof Zap; label: string }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${active ? 'border-[#77c8bb]/50 bg-[#194b56]' : 'border-white/10 bg-[#0b2935]'}`}>
      <span className={`mx-auto mb-4 grid size-10 place-items-center rounded-full ${active ? 'bg-[#d9eee8] text-[#17635d]' : 'bg-white/7 text-[#9db4bb]'}`}><Icon className="size-4" /></span>
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#c0d0d4]">{eyebrow}</p>
      <p className="mt-2 text-sm font-medium leading-5">{label}</p>
    </div>
  );
}

function FlowArrow() {
  return <div className="flex items-center text-[#6fa99f]" aria-hidden="true"><span className="h-px w-2 bg-current sm:w-5" /><ChevronRight className="-ml-1 size-4" /></div>;
}

function CoverageStatus({ status }: { status: string }) {
  const pilot = status === 'Pilot release' || status === 'Observed screen';
  const common = status === 'Reference ready' || status === 'Common signal';
  const tone = pilot
    ? 'border-[#9bc7bd] bg-[#e5f2ee] text-[#17645d]'
    : common
      ? 'border-[#b6c8d0] bg-[#edf2f4] text-[#456574]'
      : 'border-[#e0b18f] bg-[#fff0e4] text-[#96502d]';
  return <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.06em] ${tone}`}><span className="size-1.5 rounded-full bg-current opacity-70" />{status}</span>;
}
