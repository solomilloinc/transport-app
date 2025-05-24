'use client';

import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

interface FilterBarProps {
  children: ReactNode;
  onReset: () => void;
}

export function FilterBar({ children, onReset }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {children}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button variant="outline" onClick={onReset}>
          Restablecer
        </Button>
      </div>
    </div>
  );
}
