import { Database, ExternalLink, ShieldCheck } from 'lucide-react';

import { EvidenceExplorer } from '@/components/evidence-explorer';
import { EvidencePill, PageIntro, SiteFooter, SiteHeader } from '@/components/site-shell';
import releaseData from '@/public/data/latest.json';

export default function EvidencePage() {
  const pipeline = releaseData.baseline.ai_project_pipeline;
  return (
    <main className="min-h-screen bg-[#f5f3ec] text-[#17343d]">
      <SiteHeader />
      <PageIntro eyebrow="Evidence register" title="Inspect the record before interpreting the result." description="Every project, indicator and claim retains its public source, time stamp, geography and evidence status. The current view is Alberta-first and deliberately distinguishes reported fields from research classifications." />
      <section className="border-b border-[#d4dcd7] bg-[#0c2c38] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-px bg-white/10 sm:grid-cols-3">
          <Metric label="Core facility records" value={String(pipeline.core_project_count)} note="Inferred classification" />
          <Metric label="Known reported core capex" value={`$${(pipeline.known_core_capex_cad / 1_000_000_000).toFixed(2)}B`} note={`${pipeline.known_core_capex_coverage.projects_with_value} of ${pipeline.known_core_capex_coverage.core_projects} records have values`} />
          <Metric label="Enabling power records" value={String(pipeline.enabling_power_project_count)} note="Kept separate to prevent double counting" />
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="mb-8 grid gap-4 rounded-xl border border-[#e1b48e] bg-[#fff3e8] p-5 md:grid-cols-[auto_1fr]">
          <ShieldCheck className="mt-0.5 size-5 text-[#a3532b]" />
          <div><p className="font-medium text-[#713b25]">Announcement pipeline, not committed investment</p><p className="mt-1 text-sm leading-6 text-[#825a47]">{pipeline.warning} The $50B scenario remains a separate counterfactual even though its headline magnitude is close to the current sum of known reported values.</p></div>
        </div>
        <EvidenceExplorer projects={releaseData.baseline.projects} />
      </section>
      <section className="border-t border-[#d5ddd8] bg-[#e9ebe5]">
        <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12">
          <div className="mb-6 flex items-center gap-2"><Database className="size-4 text-[#24746c]" /><h2 className="text-xl font-medium">Registered public sources</h2></div>
          <div className="grid gap-3 md:grid-cols-2">
            {releaseData.sources.map((source) => (
              <article className="rounded-xl border border-[#d2dad5] bg-[#f8f7f1] p-4" key={source.source_id}>
                <div className="flex items-start justify-between gap-3"><EvidencePill status={source.evidence_status} /><span className="font-mono text-[10px] text-[#52645f]">as of {source.as_of_date}</span></div>
                <h3 className="mt-3 text-sm font-medium">{source.title}</h3><p className="mt-1 text-xs text-[#52645f]">{source.publisher} · {source.domain.replaceAll('_', ' ')}</p>
                <a className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#2b716a] hover:underline" href={source.canonical_url} rel="noreferrer" target="_blank">Open official source <ExternalLink className="size-3" /></a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="bg-[#0c2c38] p-6 sm:p-8"><p className="font-mono text-3xl font-semibold text-[#b9e5dc]">{value}</p><p className="mt-2 text-sm font-medium">{label}</p><p className="mt-1 text-xs text-[#93aab1]">{note}</p></div>;
}
