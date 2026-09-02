'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('AIIO route failure', { digest: error.digest, message: error.message }); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-[#f5f3ec] px-5 text-[#17343d]">
    <section className="max-w-lg rounded-2xl border border-[#d4dcd7] bg-white p-8 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#28766d]">Temporary interruption</p>
      <h1 className="mt-4 text-3xl font-medium">This view could not be rendered.</h1>
      <p className="mt-3 text-sm leading-6 text-[#60716d]">The evidence record has not been changed. Retry the view or check system status.</p>
      <div className="mt-6 flex justify-center gap-3"><button className="rounded-full bg-[#12333d] px-5 py-2.5 text-sm text-white" onClick={reset}>Try again</button><Link className="rounded-full border border-[#d4dcd7] px-5 py-2.5 text-sm" href="/status">System status</Link></div>
    </section>
  </main>;
}
