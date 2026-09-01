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
      className="inline-flex rounded-full border border-[#d9ddd8] bg-[#f0f0eb] p-0.5"
    >
      <Link
        aria-current={decisionMode ? 'page' : undefined}
        className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
          decisionMode
            ? 'bg-[#145f59] text-white'
            : 'text-[#526762] hover:text-[#173f40]'
        }`}
        href="/"
      >
        {compact ? 'Decision' : 'Decision mode'}
      </Link>
      <Link
        aria-current={researchMode ? 'page' : undefined}
        className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
          researchMode
            ? 'bg-[#145f59] text-white'
            : 'text-[#526762] hover:text-[#173f40]'
        }`}
        href="/research"
      >
        {compact ? 'Research' : 'Research mode'}
      </Link>
    </nav>
  );
}
