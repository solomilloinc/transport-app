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
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
          {identity.logoUrl ? (
            <Image src={identity.logoUrl} alt={identity.companyName} width={24} height={24} className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Bus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          )}
          <span className="text-base sm:text-xl font-bold text-blue-800 font-display">{identity.companyNameShort}</span>
        </Link>

        {middleContent && <nav className="hidden md:flex gap-6">{middleContent}</nav>}
        <div className="flex items-center gap-2 sm:gap-4">
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
