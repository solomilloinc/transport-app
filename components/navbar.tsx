'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Bus } from 'lucide-react';
import LoginButton from './login-button';
import { useTenant } from '@/contexts/TenantContext';
import Image from 'next/image';

interface NavbarProps {
  middleContent?: ReactNode;
}

export default function Navbar({ middleContent }: NavbarProps) {
  const { identity } = useTenant();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[rgba(255,250,241,0.82)] backdrop-blur-xl">
      <div className="container flex h-16 sm:h-20 items-center justify-between px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
          {identity.logoUrl ? (
            <Image src={identity.logoUrl} alt={identity.companyName} width={36} height={36} className="h-8 w-8 rounded-full object-cover ring-1 ring-black/5 sm:h-9 sm:w-9" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#12353d,#356977)] text-white shadow-lg shadow-slate-900/15">
              <Bus className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-display text-lg text-slate-900 sm:text-2xl">{identity.companyNameShort}</span>
            <span className="hidden text-[11px] uppercase tracking-[0.28em] text-slate-500 md:block">
              viajes con salida clara
            </span>
          </div>
        </Link>

        {middleContent && <nav className="hidden items-center gap-6 rounded-full border border-black/5 bg-white/70 px-5 py-2.5 shadow-sm md:flex">{middleContent}</nav>}
        <div className="flex items-center gap-2 sm:gap-4">
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
