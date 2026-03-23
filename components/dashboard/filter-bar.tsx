'use client';

import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

interface FilterBarProps {
  children: ReactNode;
  onReset: () => void;
}

export function FilterBar({ children, onReset }: FilterBarProps) {
  return (
    <div className="rounded-[1.5rem] border border-black/6 bg-white/72 p-4 shadow-[0_16px_36px_rgba(22,34,24,0.05)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
      {children}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button variant="outline" onClick={onReset} className="rounded-full">
            Restablecer
          </Button>
        </div>
      </div>
    </div>
  );
}
