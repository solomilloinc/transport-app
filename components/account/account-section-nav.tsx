'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  {
    href: '/account/bookings',
    label: 'Mis reservas',
    icon: CalendarDays,
  },
  {
    href: '/account/profile',
    label: 'Mis datos',
    icon: UserRound,
  },
];

export function AccountSectionNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
