/**
 * Horarios de subida: usamos lo que devuelve la API (PickupTime en paradas, PickupTimeOffset en opciones del viaje).
 * No sumamos minutos extra en frontend: la ciudad vs. parada ya viene resuelta en el backend.
 */

/** Hora de salida del servicio + offset API (ej. "00:15:00" → +15 min). */
export function addDepartureOffset(departureHour: string, offset: string): string {
  const [dh, dm] = departureHour.split(':').map(Number);
  const [oh, om] = offset.split(':').map(Number);
  let totalMinutes = dh * 60 + dm + oh * 60 + om;
  totalMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

/** "09:20:00" o ISO → "09:20" */
export function formatClockHm(time: string | undefined | null): string {
  if (!time) return '—';
  const t = time.trim().split(/\s+/)[0]?.split('T').pop() ?? time;
  return t.length >= 5 ? t.slice(0, 5) : t;
}

/** Hora estimada en subida: salida del micro + offset de la opción elegida (sin margen adicional). */
export function estimatedPickupFromDeparture(
  departureHour: string | undefined,
  pickupTimeOffset: string | null | undefined,
  hasPickupDirectionSelected: boolean,
): string | null {
  if (!departureHour || !hasPickupDirectionSelected) return null;
  if (pickupTimeOffset) return addDepartureOffset(departureHour, pickupTimeOffset);
  return formatClockHm(departureHour);
}
