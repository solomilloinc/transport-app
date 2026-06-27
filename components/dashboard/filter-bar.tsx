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
  labels?: string[];
  itemClassName?: string;
}

export function FilterBar({
  children,
  onReset,
  onApply,
  applyLabel = 'Aplicar',
  resetLabel = 'Restablecer',
  labels,
  itemClassName = 'w-full sm:w-[220px]',
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-wrap gap-4 flex-1">
        {Children.map(children, (child, i) => (
          <div key={i} className={`${itemClassName} space-y-1.5`}>
            {labels?.[i] && (
              <span className="block text-xs font-medium text-muted-foreground">
                {labels[i]}
              </span>
            )}
            {child}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row lg:items-end shrink-0">
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
