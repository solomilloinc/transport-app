// utils/date.ts
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

const timeZone = "America/Argentina/Buenos_Aires";

/**
 * Parsea una fecha ISO y la convierte a la zona horaria local configurada
 */
export const parseToLocalDate = (isoString: string): Date => {
  const parsedDate = parseISO(isoString);
  return toZonedTime(parsedDate, timeZone);
};

/**
 * Formatea una fecha ISO con el timezone local configurado
 */

/*
export const formatWithTimezone = (
  isoString: string,
  dateFormat: string = "EEEE, d 'de' MMMM 'de' yyyy"
): string => {
  const localDate = parseToLocalDate(isoString);
  return format(localDate, dateFormat, { locale: es });
};
*/

export function formatWithTimezone(dateIso?: string, tz = 'America/Argentina/Buenos_Aires') {
  if (!dateIso) return '';
  const d = new Date(dateIso);
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: undefined,
    timeZone: tz,
  }).format(d);
}