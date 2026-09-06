import { ArrowUpRight, BookOpen, CalendarDays } from 'lucide-react';

import {
  EvidencePill,
  PageIntro,
  SiteFooter,
  ResearchShell,
} from '@/components/site-shell';
import releaseData from '@/public/data/latest.json';

export default function DigestPage() {
  const digest = releaseData.digest;
  return (
    <ResearchShell>
      <PageIntro
        eyebrow="Weekly evidence digest"
        title="Evidence digest"
        description="The digest records what changed in public sources and what it might mean for the research. It never changes a model value automatically; promotion requires validation, review and a versioned release."
      />
      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-brand" />
              <span className="font-mono text-xs uppercase tracking-[0.13em] text-brand">
                Latest edition
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em]">
              Alberta evidence watch
            </h2>
          </div>
          <p className="flex items-center gap-2 font-mono text-xs text-subtle">
            <CalendarDays className="size-4" />
            {digest.edition_date} · {digest.status}
          </p>
        </div>
        <div className="space-y-5">
          {digest.items.map((item) => (
            <article
              className="rounded-lg border border-line bg-surface p-5 sm:p-7"
              key={item.headline}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <EvidencePill status={item.evidence_status} />
                <span className="font-mono text-[10px] text-subtle">
                  {item.source_id}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-medium tracking-[-0.015em]">
                {item.headline}
              </h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-brand">
                    Observed change
                  </p>
                  <p className="mt-2 text-sm leading-6 text-subtle">
                    {item.observed_change}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-caution">
                    Potential model implication
                  </p>
                  <p className="mt-2 text-sm leading-6 text-subtle">
                    {item.model_implication}
                  </p>
                </div>
              </div>
              <a
                className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                href={item.source_url}
                rel="noreferrer"
                target="_blank"
              >
                Open official source <ArrowUpRight className="size-3" />
              </a>
            </article>
          ))}
        </div>
        <p className="mt-8 rounded-lg border border-line bg-workspace p-4 text-sm text-subtle">
          {digest.promotion_rule}
        </p>
      </section>
      <SiteFooter />
    </ResearchShell>
  );
}
