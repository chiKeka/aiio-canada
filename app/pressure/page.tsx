import { AlertTriangle } from 'lucide-react';

import { EvidencePill, PageIntro, SiteFooter, SiteHeader } from '@/components/site-shell';
import releaseData from '@/public/data/latest.json';

export default function PressurePage() {
  const prices = releaseData.baseline.construction_prices;
  const trades = releaseData.scenario.trade_pressure_order;
  const outcomes = releaseData.scenario.public_delivery_pressure_order;
  const maxTrade = Math.max(...trades.map((item) => item.high));
  const maxOutcome = Math.max(...outcomes.map((item) => item.high));
  return (
    <main className="min-h-screen bg-[#f5f3ec] text-[#17343d]">
      <SiteHeader />
      <PageIntro eyebrow="Pressure monitor" title="Separate what the market is doing from what the scenario explores." description="Observed construction-price signals establish the baseline. The graph layer then traces a clearly labelled scenario through resources and public delivery without converting a diagnostic index into unsupported dollars, workers or delay days." />
      <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mb-6 flex items-center justify-between"><div><div className="flex items-center gap-2"><EvidencePill status="observed" /><span className="font-mono text-xs text-[#52645f]">STATCAN_BCPI_18100289</span></div><h2 className="mt-3 text-2xl font-medium tracking-[-0.025em]">Latest Alberta construction-price baseline</h2></div><span className="hidden font-mono text-xs text-[#52645f] sm:block">2023=100 · not seasonally adjusted</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {prices.map((price) => <article className="rounded-xl border border-[#d3dcd6] bg-[#fbfaf5] p-5" key={`${price.indicator_id}-${price.geography_id}`}><p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#52645f]">{price.geography_id === 'CMA_825' ? 'Calgary' : 'Edmonton'} · {price.indicator_id.includes('SCHOOL') ? 'School' : 'Non-residential'}</p><p className="mt-5 font-mono text-3xl font-semibold text-[#155d59]">{price.value.toFixed(1)}</p><p className="mt-1 text-xs text-[#52645f]">{price.quarter_over_quarter_percent > 0 ? '+' : ''}{price.quarter_over_quarter_percent.toFixed(2)}% quarter over quarter</p><p className="mt-4 border-t border-[#e0e5e1] pt-3 text-[10px] text-[#52645f]">Period ending {price.period_end}</p></article>)}
        </div>
      </section>
      <section className="bg-[#0b2a36] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="mb-10 grid gap-5 border-b border-white/10 pb-8 lg:grid-cols-[1fr_auto]"><div><div className="flex items-center gap-2"><EvidencePill status="scenario" /><EvidencePill status="assumed" /></div><h2 className="mt-4 text-3xl font-medium tracking-[-0.035em]">$50B counterfactual diagnostic · pressure ordering</h2></div><p className="max-w-md text-sm leading-6 text-[#a7bbc1]">Low, central and high cases co-move assumed edge weights and retention. They are structural stress cases, not uncertainty intervals. Scores are bounded display indices, not delay percentages.</p></div>
          <div className="grid gap-8 lg:grid-cols-2">
            <PressureList title="Trades pinched first" items={trades} max={maxTrade} />
            <PressureList title="Public delivery exposure" items={outcomes} max={maxOutcome} />
          </div>
          <div className="mt-10 flex gap-3 rounded-xl border border-[#de9b62]/30 bg-[#7c401f]/20 p-5 text-sm leading-6 text-[#e9c7ab]"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><p>The graph receives 46% of scenario capex; 54% is deliberately outside it. Display values use raw ÷ (1 + raw) only to keep the index in [0,1). They cannot be read as probabilities, percentage cost increases or schedule delays. Calibration is a release gate.</p></div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function PressureList({ title, items, max }: { title: string; items: Array<{ node_id: string; label: string; low: number; central: number; high: number }>; max: number }) {
  return <div><h3 className="mb-5 text-sm font-medium text-[#d7e3e6]">{title}</h3><div className="space-y-5">{items.map((item, index) => <div key={item.node_id}><div className="mb-2 flex items-center justify-between text-xs"><span className="flex items-center gap-2"><span className="font-mono text-[#6f939b]">0{index + 1}</span>{item.label}</span><span className="font-mono text-[#89aaa8]">{item.low.toFixed(2)}–{item.high.toFixed(2)}</span></div><div className="relative h-2 rounded-full bg-white/8"><div className="absolute h-full rounded-full bg-[#2f8f83]" style={{ width: `${(item.central / max) * 100}%` }} /><span className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-[#0b2a36] bg-[#efad65]" style={{ left: `calc(${(item.high / max) * 100}% - 6px)` }} /></div></div>)}</div></div>;
}
