import { Download, FileJson2, FileSpreadsheet, Fingerprint } from 'lucide-react';

import { PageIntro, SiteFooter, SiteHeader } from '@/components/site-shell';
import releaseData from '@/public/data/latest.json';

const downloads = [
  { icon: FileJson2, title: 'Complete public data bundle', detail: 'Baseline, diagnostic scenario, independent power overlay, sources, digest and release manifest', href: '/data/latest.json', format: 'JSON' },
  { icon: Fingerprint, title: 'Release manifest', detail: 'Input and output hashes, model version and code state', href: '/data/manifest.json', format: 'JSON' },
  { icon: FileSpreadsheet, title: 'Alberta AI project register', detail: 'Observed project fields with inferred AI classification', href: '/downloads/alberta_ai_projects.csv', format: 'CSV' },
  { icon: FileSpreadsheet, title: 'Alberta BCPI observations', detail: 'Calgary and Edmonton normalized construction-price rows', href: '/downloads/bcpi_alberta.csv', format: 'CSV' },
  { icon: FileSpreadsheet, title: 'Alberta labour availability', detail: 'Graph-relevant NOC vacancy and offered-wage observations with suppression and quality flags', href: '/downloads/labour_availability_alberta.csv', format: 'CSV' },
  { icon: FileSpreadsheet, title: 'Auditable Alberta pilot workbook', detail: 'Formula-driven assumptions, diagnostic outputs, evidence registers and release checks', href: `/downloads/AIIO_Alberta_Pilot_${releaseData.manifest.version}.xlsx`, format: 'XLSX' },
];

export default function DownloadsPage() {
  return <main className="min-h-screen bg-[#f5f3ec] text-[#17343d]"><SiteHeader /><PageIntro eyebrow="Downloads and reproducibility" title="One release, many publication surfaces." description="Download the same versioned evidence and scenario artifacts used by the website. File hashes in the manifest make mixed vintages and silent changes detectable." />
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16"><div className="mb-8 rounded-xl border border-[#cbd7d1] bg-[#e8eeea] p-5"><p className="font-mono text-xs text-[#2a7069]">RELEASE {releaseData.manifest.version}</p><div className="mt-3 grid gap-2 text-xs text-[#52645f] md:grid-cols-2"><p>Model: {releaseData.manifest.model_version}</p><p>Schema: {releaseData.manifest.schema_version}</p><p>Input manifest: <span className="font-mono">{releaseData.manifest.input_manifest_hash.slice(0, 28)}…</span></p><p>Status: {releaseData.manifest.status}</p></div></div><div className="grid gap-4 sm:grid-cols-2">{downloads.map((item) => <a className="group rounded-xl border border-[#d2dbd5] bg-[#fbfaf5] p-5 transition-transform hover:-translate-y-0.5 hover:border-[#9fb8ae]" download href={item.href} key={item.title}><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-full bg-[#e2efea] text-[#226d66]"><item.icon className="size-4" /></span><span className="font-mono text-[10px] text-[#52645f]">{item.format}</span></div><h2 className="mt-6 font-medium">{item.title}</h2><p className="mt-2 text-sm leading-5 text-[#52645f]">{item.detail}</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-[#2a7069]">Download <Download className="size-3" /></span></a>)}</div></section><SiteFooter /></main>;
}
