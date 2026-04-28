'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import {
  ServiceSchedule,
  ServiceScheduleDraft,
  ServiceScheduleSyncRequest,
} from '@/interfaces/serviceSchedule';
import { syncServiceSchedules } from '@/services/service-schedules';

export interface SchedulesEditorHandle {
  /** Whether the local buffer differs from the last accepted value. */
  isDirty: () => boolean;
  /** Snapshot of the current editor rows (useful for parent submits in 'buffered' mode). */
  getDrafts: () => ServiceScheduleDraft[];
  /** For buffered mode: returns true if every row has a valid departureHour and there is at least one row. */
  isValid: () => boolean;
  /** Reset the editor buffer to a supplied list (or to the current `value` prop if omitted). */
  reset: (next?: ServiceScheduleDraft[]) => void;
}

export interface SchedulesEditorProps {
  /**
   * - `buffered` = Create dialog. The editor holds the drafts in memory and
   *   the parent reads them via ref.getDrafts() to include them in the
   *   Create POST payload.
   * - `synced` = Edit dialog. The editor owns its own Save button and
   *   calls `PUT /api/service-schedules-sync/{serviceId}` directly. On
   *   success it invokes `onSaved` so the parent can refetch.
   */
  mode: 'buffered' | 'synced';
  /** Initial / authoritative list of schedules. Changing this prop resets the buffer. */
  value: ServiceScheduleDraft[];
  /** Fires on every local mutation. Parent can use it to e.g. enable the Create submit button. */
  onChange?: (next: ServiceScheduleDraft[]) => void;
  /** Required when mode='synced'. The serviceId used for the PUT. */
  serviceId?: number;
  /** Called after a successful bulk sync so the parent can refetch. Only used in 'synced' mode. */
  onSaved?: () => void;
  /** Disables all interactions (e.g. while the parent is submitting). */
  disabled?: boolean;
}

const DEFAULT_DEPARTURE_HOUR = '06:00';

/** Normalizes any "HH:MM" or "HH:MM:SS" input to "HH:MM" for editor display. */
function toDisplayHour(raw: string): string {
  if (!raw) return '';
  const [h = '00', m = '00'] = raw.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

/** Normalizes "HH:MM" (from <input type="time">) to the "HH:MM:SS" format expected by the API. */
export function toApiHour(displayHour: string): string {
  if (!displayHour) return '00:00:00';
  return displayHour.length === 5 ? `${displayHour}:00` : displayHour;
}

export function isHourValid(displayHour: string): boolean {
  if (!displayHour) return false;
  const normalized = toDisplayHour(displayHour);
  return normalized !== '00:00';
}

function draftsEqual(a: ServiceScheduleDraft[], b: ServiceScheduleDraft[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].ServiceScheduleId !== b[i].ServiceScheduleId ||
      a[i].DepartureHour !== b[i].DepartureHour ||
      a[i].IsHoliday !== b[i].IsHoliday
    ) {
      return false;
    }
  }
  return true;
}

function sortedByHour(list: ServiceScheduleDraft[]): ServiceScheduleDraft[] {
  return [...list].sort((a, b) => a.DepartureHour.localeCompare(b.DepartureHour));
}

export const SchedulesEditor = forwardRef<SchedulesEditorHandle, SchedulesEditorProps>(
  function SchedulesEditor(
    { mode, value, onChange, serviceId, onSaved, disabled = false },
    ref,
  ) {
    const normalizeIncoming = useCallback(
      (list: ServiceScheduleDraft[]): ServiceScheduleDraft[] =>
        list.map((d) => ({
          ServiceScheduleId: d.ServiceScheduleId ?? null,
          DepartureHour: toDisplayHour(d.DepartureHour),
          IsHoliday: !!d.IsHoliday,
        })),
      [],
    );

    const [drafts, setDrafts] = useState<ServiceScheduleDraft[]>(() =>
      normalizeIncoming(value),
    );
    const baselineRef = useRef<ServiceScheduleDraft[]>(normalizeIncoming(value));
    const [isSaving, setIsSaving] = useState(false);

    // Reset editor when the authoritative list changes (e.g. parent refetched).
    useEffect(() => {
      const next = normalizeIncoming(value);
      setDrafts(next);
      baselineRef.current = next;
    }, [value, normalizeIncoming]);

    const commit = useCallback(
      (next: ServiceScheduleDraft[]) => {
        setDrafts(next);
        onChange?.(next);
      },
      [onChange],
    );

    const handleAdd = () => {
      commit([
        ...drafts,
        {
          ServiceScheduleId: null,
          DepartureHour: DEFAULT_DEPARTURE_HOUR,
          IsHoliday: false,
        },
      ]);
    };

    const handleRemove = (index: number) => {
      commit(drafts.filter((_, i) => i !== index));
    };

    const handleHourChange = (index: number, raw: string) => {
      const next = drafts.map((d, i) =>
        i === index ? { ...d, DepartureHour: toDisplayHour(raw) } : d,
      );
      commit(next);
    };

    const handleHolidayChange = (index: number, isHoliday: boolean) => {
      const next = drafts.map((d, i) => (i === index ? { ...d, IsHoliday: isHoliday } : d));
      commit(next);
    };

    const orderedDrafts = useMemo(() => sortedByHour(drafts), [drafts]);

    const allRowsValid = useMemo(
      () => drafts.length > 0 && drafts.every((d) => isHourValid(d.DepartureHour)),
      [drafts],
    );

    const isDirty = useCallback(
      () => !draftsEqual(drafts, baselineRef.current),
      [drafts],
    );

    useImperativeHandle(
      ref,
      () => ({
        isDirty,
        getDrafts: () => drafts,
        isValid: () => allRowsValid,
        reset: (next) => {
          const target = normalizeIncoming(next ?? value);
          setDrafts(target);
          baselineRef.current = target;
        },
      }),
      [drafts, isDirty, allRowsValid, normalizeIncoming, value],
    );

    const handleSave = async () => {
      if (mode !== 'synced') return;
      if (!serviceId) {
        toast({
          title: 'Error',
          description: 'No se puede guardar sin serviceId.',
          variant: 'destructive',
        });
        return;
      }
      if (!allRowsValid) {
        toast({
          title: 'Horarios inválidos',
          description: 'Corregí las horas antes de guardar.',
          variant: 'destructive',
        });
        return;
      }

      const payload: ServiceScheduleSyncRequest = {
        schedules: drafts.map((d) => ({
          serviceScheduleId: d.ServiceScheduleId,
          departureHour: toApiHour(d.DepartureHour),
          isHoliday: d.IsHoliday,
        })),
      };

      setIsSaving(true);
      try {
        await syncServiceSchedules(serviceId, payload);
        toast({
          title: 'Horarios guardados',
          description: 'Los horarios del servicio se actualizaron correctamente.',
          variant: 'success',
        });
        baselineRef.current = drafts;
        onSaved?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        let description = 'Ocurrió un error al guardar los horarios.';
        if (message.includes('Service.ScheduleNotInService')) {
          description = 'Uno de los horarios no pertenece al servicio. Recargá e intentá de nuevo.';
        } else if (message.includes('Validation.DepartureHour')) {
          description = 'La hora de salida debe ser mayor a 00:00.';
        } else if (message.includes('ServiceNotFound')) {
          description = 'El servicio no existe.';
        }
        toast({ title: 'Error', description, variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
    };

    const rowsToRender = orderedDrafts;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Horarios de salida</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={disabled || isSaving}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar horario
          </Button>
        </div>

        {rowsToRender.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay horarios configurados. Agregá al menos uno.
          </p>
        )}

        <div className="space-y-2">
          {rowsToRender.map((d) => {
            // Find the index in the non-sorted `drafts` array so handlers mutate the right row.
            const originalIndex = drafts.indexOf(d);
            const hourValid = isHourValid(d.DepartureHour);
            return (
              <div
                key={
                  d.ServiceScheduleId != null
                    ? `id-${d.ServiceScheduleId}`
                    : `new-${originalIndex}`
                }
                className="flex items-end gap-2"
              >
                <div className="flex-1">
                  <Label className="text-xs">Hora</Label>
                  <Input
                    type="time"
                    value={toDisplayHour(d.DepartureHour)}
                    onChange={(e) => handleHourChange(originalIndex, e.target.value)}
                    disabled={disabled || isSaving}
                    className={!hourValid ? 'border-destructive' : ''}
                  />
                  {!hourValid && (
                    <p className="text-xs text-destructive mt-1">
                      La hora debe ser mayor a 00:00.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox
                    id={`holiday-${originalIndex}`}
                    checked={d.IsHoliday}
                    onCheckedChange={(checked) =>
                      handleHolidayChange(originalIndex, !!checked)
                    }
                    disabled={disabled || isSaving}
                  />
                  <Label htmlFor={`holiday-${originalIndex}`} className="text-xs">
                    Feriado
                  </Label>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemove(originalIndex)}
                  disabled={disabled || isSaving}
                  aria-label="Eliminar horario"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {mode === 'synced' && (
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSave}
              disabled={disabled || isSaving || !isDirty() || !allRowsValid}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar horarios'
              )}
            </Button>
          </div>
        )}
      </div>
    );
  },
);
