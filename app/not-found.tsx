import Link from 'next/link';

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[#f5f3ec] px-5 text-[#17343d]"><section className="max-w-lg text-center"><p className="font-mono text-xs uppercase tracking-[0.14em] text-[#28766d]">404 · outside the graph</p><h1 className="mt-4 text-4xl font-medium">That route does not exist.</h1><p className="mt-3 text-sm text-[#60716d]">Return to the executive dashboard or open the public evidence record.</p><div className="mt-6 flex justify-center gap-3"><Link className="rounded-full bg-[#12333d] px-5 py-2.5 text-sm text-white" href="/">Dashboard</Link><Link className="rounded-full border border-[#d4dcd7] px-5 py-2.5 text-sm" href="/evidence">Evidence</Link></div></section></main>;
}
