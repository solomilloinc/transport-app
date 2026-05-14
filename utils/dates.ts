import { format, isSameDay, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const timeZone = 'America/Argentina/Buenos_Aires';

/**
 * Parsea una fecha ISO y la convierte a la zona horaria local configurada.
 */
export const parseToLocalDate = (isoString: string): Date => {
  const parsedDate = parseISO(isoString);
  return toZonedTime(parsedDate, timeZone);
};

export function formatWithTimezone(dateIso?: string, tz = timeZone) {
  if (!dateIso) return '';
  const d = new Date(dateIso);
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: undefined,
    timeZone: tz,
  }).format(d);
}

// True when two ISO timestamps fall on the same calendar day in Argentina's timezone.
// Slicing the ISO string (`slice(0, 10)`) is unsafe because the backend returns UTC
// timestamps: a 22:00 ART departure is "01:00Z next day", which would compare wrong.
export function isSameDayInArgentinaTZ(iso1: string, iso2: string): boolean {
  const d1 = toZonedTime(parseISO(iso1), timeZone);
  const d2 = toZonedTime(parseISO(iso2), timeZone);
  return isSameDay(d1, d2);
}
