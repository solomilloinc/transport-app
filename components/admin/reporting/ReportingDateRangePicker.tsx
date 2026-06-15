'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DateRange,
  MAX_RANGE_DAYS,
  RANGE_PRESETS,
  RangePresetId,
  detectPreset,
  exceedsMaxWindow,
  presetRange,
} from '@/lib/reporting/date-ranges';

interface Props {
  value: DateRange;
  /** Commit del rango elegido (no dispara fetch; eso lo hace "Aplicar" de la barra). */
  onChange: (range: DateRange) => void;
}

function labelForRange(range: DateRange): string {
  if (!range.dateFrom || !range.dateTo) return 'Elegí un rango';
  const id = detectPreset(range);
  const preset = RANGE_PRESETS.find((p) => p.id === id);
  if (preset) return preset.label;
  try {
    const f = format(new Date(range.dateFrom), 'dd/MM/yyyy', { locale: es });
    const t = format(new Date(range.dateTo), 'dd/MM/yyyy', { locale: es });
    return `${f} – ${t}`;
  } catch {
    return `${range.dateFrom} – ${range.dateTo}`;
  }
}

export function ReportingDateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<RangePresetId>(() => detectPreset(value));
  const [draft, setDraft] = useState<DateRange>(value);

  // Re-sincronizar cuando cambia el valor externo (p.ej. reset de filtros).
  useEffect(() => {
    if (!open) {
      setDraft(value);
      setPreset(detectPreset(value));
    }
  }, [value, open]);

  const tooLong = useMemo(
    () => preset === 'custom' && exceedsMaxWindow(draft.dateFrom, draft.dateTo),
    [preset, draft.dateFrom, draft.dateTo]
  );
  const invalidOrder = useMemo(
    () =>
      preset === 'custom' &&
      !!draft.dateFrom &&
      !!draft.dateTo &&
      draft.dateFrom > draft.dateTo,
    [preset, draft.dateFrom, draft.dateTo]
  );
  const incomplete = preset === 'custom' && (!draft.dateFrom || !draft.dateTo);
  const canApply = !tooLong && !invalidOrder && !incomplete;

  const handlePreset = (id: RangePresetId) => {
    setPreset(id);
    if (id !== 'custom') setDraft(presetRange(id));
  };

  const handleApply = () => {
    if (!canApply) return;
    onChange(draft);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          {labelForRange(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <div className="space-y-4">
          <p className="text-sm font-medium">Intervalo de tiempo</p>

          <RadioGroup
            value={preset}
            onValueChange={(v) => handlePreset(v as RangePresetId)}
            className="space-y-1"
          >
            {RANGE_PRESETS.map((p) => (
              <div key={p.id} className="flex items-center space-x-2">
                <RadioGroupItem value={p.id} id={`range-${p.id}`} />
                <Label htmlFor={`range-${p.id}`} className="font-normal cursor-pointer">
                  {p.label}
                </Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="range-custom" />
              <Label htmlFor="range-custom" className="font-normal cursor-pointer">
                Personalizado
              </Label>
            </div>
          </RadioGroup>

          {preset === 'custom' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Desde</Label>
                  <Input
                    type="date"
                    value={draft.dateFrom}
                    max={draft.dateTo || undefined}
                    onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Hasta</Label>
                  <Input
                    type="date"
                    value={draft.dateTo}
                    min={draft.dateFrom || undefined}
                    onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
                  />
                </div>
              </div>
              {tooLong && (
                <p className="text-xs text-red-600">
                  El rango no puede superar {MAX_RANGE_DAYS} días. Achicá las fechas.
                </p>
              )}
              {invalidOrder && (
                <p className="text-xs text-red-600">
                  "Desde" no puede ser posterior a "Hasta".
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleApply} disabled={!canApply}>
              Aceptar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
