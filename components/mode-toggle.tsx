'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ModeToggle({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const decisionMode = pathname === '/';
  const researchMode = pathname === '/research';

  return (
    <nav
      aria-label="View mode"
      className="inline-flex rounded-lg border border-white/15 bg-black/10 p-0.5"
    >
      <Link
        aria-current={decisionMode ? 'page' : undefined}
        className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
          decisionMode
            ? 'bg-[#dff1eb] text-[#124e4a]'
            : 'text-[#b7c8ce] hover:text-white'
        }`}
        href="/"
      >
        {compact ? 'Decision' : 'Decision mode'}
      </Link>
      <Link
        aria-current={researchMode ? 'page' : undefined}
        className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
          researchMode
            ? 'bg-[#dff1eb] text-[#124e4a]'
            : 'text-[#b7c8ce] hover:text-white'
        }`}
        href="/research"
      >
        {compact ? 'Research' : 'Research mode'}
      </Link>
    </nav>
  );
}
