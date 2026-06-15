import { format, subDays, differenceInCalendarDays } from 'date-fns';

/** Ventana máxima del backend (charter §0.2). Reportar > esto ⇒ 422. */
export const MAX_RANGE_DAYS = 92;

export type RangePresetId = 'today' | 'last3' | 'last7' | 'last30' | 'custom';

export interface DateRange {
  dateFrom: string; // yyyy-MM-dd
  dateTo: string; // yyyy-MM-dd
}

export const RANGE_PRESETS: { id: Exclude<RangePresetId, 'custom'>; label: string; days: number }[] = [
  { id: 'today', label: 'Hoy', days: 0 },
  { id: 'last3', label: 'Últimos 3 días', days: 2 },
  { id: 'last7', label: 'Últimos 7 días', days: 6 },
  { id: 'last30', label: 'Últimos 30 días', days: 29 },
];

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

/** Ventana rodante terminada hoy: [hoy - days, hoy]. */
export function presetRange(id: Exclude<RangePresetId, 'custom'>, today: Date = new Date()): DateRange {
  const preset = RANGE_PRESETS.find((p) => p.id === id) ?? RANGE_PRESETS[2];
  return { dateFrom: fmt(subDays(today, preset.days)), dateTo: fmt(today) };
}

/** Default al abrir la Reportería (decisión D8): últimos 7 días. */
export function defaultRange(today: Date = new Date()): DateRange {
  return presetRange('last7', today);
}

/** Cantidad de días de la ventana (`dateTo - dateFrom`). `null` si alguna fecha falta. */
export function rangeDays(from?: string, to?: string): number | null {
  if (!from || !to) return null;
  const d = differenceInCalendarDays(new Date(to), new Date(from));
  return Number.isFinite(d) ? d : null;
}

/** ¿La ventana excede el máximo permitido por el backend? */
export function exceedsMaxWindow(from?: string, to?: string): boolean {
  const d = rangeDays(from, to);
  return d !== null && d > MAX_RANGE_DAYS;
}

/** Detecta a qué preset corresponde un rango (o 'custom'). */
export function detectPreset(range: DateRange, today: Date = new Date()): RangePresetId {
  for (const p of RANGE_PRESETS) {
    const r = presetRange(p.id, today);
    if (r.dateFrom === range.dateFrom && r.dateTo === range.dateTo) return p.id;
  }
  return 'custom';
}
