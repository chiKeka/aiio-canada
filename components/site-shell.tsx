import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { ModeToggle } from '@/components/mode-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e2e0d9] bg-[#faf9f5]/95 text-[#172f35] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link className="flex items-center gap-3" href="/" aria-label="AIIO Canada home">
          <span className="grid size-9 place-items-center rounded-full border border-[#bdd5ce] bg-white font-mono text-xs font-semibold text-[#17665f] shadow-[0_1px_2px_rgba(18,53,52,.06)]">AI</span>
          <span><span className="block text-sm font-semibold tracking-[-0.01em]">AIIO Canada</span><span className="hidden text-[9px] uppercase tracking-[0.16em] text-[#536864] sm:block">Infrastructure impact observatory</span></span>
        </Link>
        <nav className="hidden items-center gap-5 text-xs font-medium text-[#62716e] md:flex" aria-label="Primary navigation">
          <Link className="transition-colors hover:text-[#143f42]" href="/evidence">Evidence</Link>
          <Link className="transition-colors hover:text-[#143f42]" href="/pressure">Pressure</Link>
          <Link className="transition-colors hover:text-[#143f42]" href="/scenario">Scenario lab</Link>
          <Link className="transition-colors hover:text-[#143f42]" href="/methods">Methods</Link>
          <Link className="transition-colors hover:text-[#143f42]" href="/digest">Digest</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle compact />
          <Link className="hidden h-8 items-center gap-1.5 rounded-full border border-[#d5d9d4] bg-white px-3 text-xs font-medium text-[#294a49] shadow-[0_1px_2px_rgba(18,53,52,.05)] transition-colors hover:border-[#9ebeb6] hover:bg-[#f3f8f6] sm:inline-flex" href="/downloads">
            Downloads <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#081e28] text-[#9db0b7]">
      <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 px-5 py-8 text-xs sm:px-8 md:flex-row md:items-center lg:px-12">
        <p>AI Infrastructure Impact Observatory Canada · Public research in development</p>
        <p className="font-mono">Observed ≠ inferred ≠ assumed ≠ scenario</p>
      </div>
    </footer>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="border-b border-[#e2e0d9] bg-[#faf9f5]">
      <div className="observatory-grid mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#28766d]">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-medium tracking-[-0.045em] text-[#0d2b36] sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#536764]">{description}</p>
      </div>
    </section>
  );
}

export function EvidencePill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    observed: 'border-[#87bfb4] bg-[#e1f1ec] text-[#155d56]',
    inferred: 'border-[#9db7c4] bg-[#e9f0f3] text-[#365968]',
    assumed: 'border-[#e1b48e] bg-[#fff0e3] text-[#8c4928]',
    scenario: 'border-[#d9a069] bg-[#ffebd8] text-[#8f431f]',
  };
  return <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] ${styles[status] ?? 'border-[#cbd4cf] bg-white text-[#5c6e69]'}`}>{status}</span>;
}
