'use client';

import { ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface StatusOption {
  value: number;
  label: string;
}

interface Props {
  options: StatusOption[];
  /** undefined ⇒ "Por defecto" (se omite del payload → backend default). */
  value: number[] | undefined;
  onChange: (next: number[] | undefined) => void;
  /** Texto del tooltip/hint explicando qué incluye el default. */
  defaultHint: string;
}

/**
 * Multiselect de estados. Mientras no se toca, queda en `undefined` ("Por
 * defecto") y NO viaja en el payload — así el backend aplica su default sin que
 * hardcodeemos la lista (decisión D8). Al elegir/deseleccionar, los estados
 * pasan a viajar explícitos; si se vacían, vuelve a `undefined`.
 */
export function StatusFilterMulti({ options, value, onChange, defaultHint }: Props) {
  const selected = value ?? [];
  const isDefault = value === undefined;

  const toggle = (code: number, checked: boolean) => {
    const next = checked ? [...selected, code] : selected.filter((c) => c !== code);
    onChange(next.length ? next.sort((a, b) => a - b) : undefined);
  };

  const triggerLabel = isDefault
    ? 'Estados: Por defecto'
    : `Estados: ${selected.length} seleccionado${selected.length === 1 ? '' : 's'}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal" title={defaultHint}>
          <ListFilter className="mr-2 h-4 w-4 text-muted-foreground" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Estados</p>
            {!isDefault && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-1 py-0 text-xs"
                onClick={() => onChange(undefined)}
              >
                Por defecto
              </Button>
            )}
          </div>
          {isDefault && <p className="text-xs text-muted-foreground">{defaultHint}</p>}
          <div className="space-y-2">
            {options.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${opt.value}`}
                  checked={selected.includes(opt.value)}
                  onCheckedChange={(c) => toggle(opt.value, c === true)}
                />
                <Label htmlFor={`status-${opt.value}`} className="font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
