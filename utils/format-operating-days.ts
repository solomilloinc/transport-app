import { DAY_SHORT_BY_VALUE, isValidDayOfWeek } from './days-of-week';

/**
 * Formats a Service's operating days range for display.
 *
 * The backend stores (startDay, endDay) as System.DayOfWeek integers
 * (Sunday=0..Saturday=6) and supports wraparound semantics — e.g.
 * startDay=5,endDay=1 means "Viernes a Lunes" (crossing the weekend).
 *
 * This helper produces a human-friendly Spanish label for the listing
 * table and detail views.
 */
export function formatOperatingDays(
  startDay: number | null | undefined,
  endDay: number | null | undefined,
): string {
  if (!isValidDayOfWeek(startDay) || !isValidDayOfWeek(endDay)) {
    return '—';
  }

  if (startDay === endDay) {
    return `Solo ${DAY_SHORT_BY_VALUE[startDay]}`;
  }

  // Common friendly aliases.
  if (startDay === 1 && endDay === 0) return 'Todos los días';
  if (startDay === 1 && endDay === 5) return 'Lun a Vie';
  if (startDay === 6 && endDay === 0) return 'Fines de semana';

  return `${DAY_SHORT_BY_VALUE[startDay]} a ${DAY_SHORT_BY_VALUE[endDay]}`;
}
