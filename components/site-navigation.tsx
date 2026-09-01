'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useState } from 'react';

import { ModeToggle } from '@/components/mode-toggle';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const primaryLinks = [
  {
    href: '/evidence',
    label: 'Evidence',
    note: 'Source register and public evidence',
  },
  {
    href: '/pressure',
    label: 'Pressure',
    note: 'Labour and material market screens',
  },
  {
    href: '/scenario',
    label: 'Scenario lab',
    note: 'Bounded Alberta counterfactual',
  },
  {
    href: '/methods',
    label: 'Methods',
    note: 'Model, definitions and limitations',
  },
  { href: '/digest', label: 'Digest', note: 'Living weekly evidence record' },
] as const;

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-0.5 rounded-full border border-[#e1e2dd] bg-[#f2f2ed] p-1 text-xs font-medium xl:flex"
      aria-label="Primary navigation"
    >
      {primaryLinks.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-3 py-1.5 transition-all ${
              active
                ? 'bg-white text-[#174e4b] shadow-[0_1px_2px_rgba(13,43,54,0.08)]'
                : 'text-[#62716e] hover:bg-white/70 hover:text-[#143f42]'
            }`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        aria-label="Open site navigation"
        className="inline-flex size-10 items-center justify-center rounded-full border border-[#d5d9d4] bg-white text-[#294a49] transition-colors hover:border-[#9ebeb6] hover:bg-[#f3f8f6] xl:hidden"
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent
        className="border-[#d8dcd7] bg-[#f7f6f1] p-0 text-[#17343d]"
        side="right"
      >
        <SheetHeader className="border-b border-[#d8dcd7] px-6 py-6">
          <SheetTitle className="text-xl font-medium tracking-[-0.025em] text-[#0d2b36]">
            AIIO Canada
          </SheetTitle>
          <SheetDescription className="text-xs leading-5 text-[#5b6d69]">
            Move between the executive workspace and the public research record.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pt-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-[#28766d]">
            View mode
          </p>
          <div className="mt-3">
            <ModeToggle />
          </div>
        </div>
        <nav
          className="grid gap-1 px-3 py-5"
          aria-label="Mobile primary navigation"
        >
          {primaryLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                aria-current={active ? 'page' : undefined}
                className={`rounded-[10px] border px-3 py-3 transition-colors ${
                  active
                    ? 'border-[#9fc8bf] bg-[#e1f1ec] text-[#154f4a]'
                    : 'border-transparent text-[#536864] hover:border-[#d8dcd7] hover:bg-white'
                }`}
                href={link.href}
                key={link.href}
                onClick={() => setOpen(false)}
              >
                <span className="block text-sm font-medium text-[#17343d]">
                  {link.label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-4">
                  {link.note}
                </span>
              </Link>
            );
          })}
          <Link
            className="mt-3 rounded-[10px] border border-[#d8dcd7] bg-white px-3 py-3 text-sm font-medium text-[#17343d]"
            href="/downloads"
            onClick={() => setOpen(false)}
          >
            Downloads and release files
          </Link>
        </nav>
        <div className="mt-auto border-t border-[#d8dcd7] px-6 py-5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#61736f]">
          Observed ≠ inferred ≠ assumed ≠ scenario
        </div>
      </SheetContent>
    </Sheet>
  );
}
