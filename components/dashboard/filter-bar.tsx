'use client';

import { Button } from '@/components/ui/button';
import { Children, type ReactNode } from 'react';

interface FilterBarProps {
  children: ReactNode;
  onReset: () => void;
  /** Si se provee, muestra un botón "Aplicar" que dispara este callback. */
  onApply?: () => void;
  applyLabel?: string;
  resetLabel?: string;
}

export function FilterBar({
  children,
  onReset,
  onApply,
  applyLabel = 'Aplicar',
  resetLabel = 'Restablecer',
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-wrap gap-4 flex-1">
        {Children.map(children, (child, i) => (
          <div key={i} className="w-full sm:w-[220px]">
            {child}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row shrink-0">
        {onApply && (
          <Button onClick={onApply}>{applyLabel}</Button>
        )}
        <Button variant="outline" onClick={onReset}>
          {resetLabel}
        </Button>
      </div>
    </div>
  );
}
