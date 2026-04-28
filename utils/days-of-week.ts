/**
 * System.DayOfWeek convention (from .NET backend):
 * Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6.
 *
 * UI displays Monday→Sunday (Argentine convention), but the `value` always
 * matches the System.DayOfWeek enum so the frontend payload matches the
 * backend contract directly.
 */

export interface DayOfWeekOption {
  value: number;
  label: string;
  short: string;
}

export const DAYS_OF_WEEK_OPTIONS: DayOfWeekOption[] = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
];

export const DAY_NAMES_BY_VALUE: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export const DAY_SHORT_BY_VALUE: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

/**
 * Maps a System.DayOfWeek value (0..6, Sunday-first) to a visual index
 * (0..6, Monday-first). Used to sort/display entities with "argentine week order".
 */
export function dayOfWeekVisualIndex(dow: number): number {
  return dow === 0 ? 6 : dow - 1;
}

export function isValidDayOfWeek(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6;
}
