import { Activity, CheckCircle2, Clock3, Database, ShieldCheck, TriangleAlert } from 'lucide-react';
import Link from 'next/link';

import { PageIntro, SiteFooter, SiteHeader } from '@/components/site-shell';
import digest from '@/public/data/latest-digest.json';
import gates from '@/data/governance/program-gates.json';
import surface from '@/public/data/research-surface.json';
import release from '@/public/data/latest.json';

const checks = [
  { icon: Database, label: 'Evidence surface', value: `${surface.artifact_count} hash-locked artifacts`, ok: surface.artifact_count > 0 },
  { icon: Clock3, label: 'Latest evidence digest', value: `${digest.edition_date} · ${digest.status}`, ok: true },
  { icon: ShieldCheck, label: 'Deployment gate', value: gates.deployment.status, ok: gates.deployment.status === 'authorized' },
  { icon: Activity, label: 'Forecast authorization', value: 'Withheld pending calibration', ok: false },
];

export default function StatusPage() {
  return <main className="min-h-screen bg-[#f5f3ec] text-[#17343d]">
    <SiteHeader />
    <PageIntro eyebrow="System status" title="Live, auditable, and explicit about its limits." description="Operational health is separate from research authorization. The website can be healthy while decision-grade model outputs remain deliberately withheld." />
    <section className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 lg:px-12">
      <div className="grid gap-4 md:grid-cols-2">
        {checks.map(({ icon: Icon, label, value, ok }) => <article className="rounded-2xl border border-[#d4dcd7] bg-white p-6" key={label}>
          <div className="flex items-start justify-between gap-4"><Icon className="size-5 text-[#26746c]" /><span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase ${ok ? 'bg-[#e1f1ec] text-[#155d56]' : 'bg-[#fff0e3] text-[#8c4928]'}`}>{ok ? 'ready' : 'withheld'}</span></div>
          <p className="mt-8 text-xs text-[#60716d]">{label}</p><p className="mt-1 text-xl font-medium text-[#12333d]">{value}</p>
        </article>)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl bg-[#12333d] p-6 text-white"><CheckCircle2 className="size-6 text-[#8ed0c5]" /><h2 className="mt-6 text-2xl font-medium">Release {release.manifest.version}</h2><p className="mt-2 text-sm leading-6 text-[#c8d7d8]">Application, public evidence, graph scenarios, and reproducibility controls are available. Automated evidence changes enter review before publication.</p></div>
        <div className="rounded-2xl border border-[#e1b48e] bg-[#fff0e3] p-6 text-[#754329]"><TriangleAlert className="size-6" /><h2 className="mt-6 text-lg font-medium">Research boundary</h2><p className="mt-2 text-sm leading-6">No AI-attributable cost premium or project delay is authorized. This is a visible safeguard, not an outage.</p></div>
      </div>
      <p className="mt-6 text-xs text-[#60716d]">Machine-readable status: <Link className="underline" href="/api/health">/api/health</Link></p>
    </section>
    <SiteFooter />
  </main>;
}
