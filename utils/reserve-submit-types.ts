import type { ReserveSummaryItem } from '@/interfaces/reserve';

/**
 * Tipos para **passenger-reserves-create-with-lock** (alineado con `applied` del quote y validador).
 * No usar en `POST /reserves/quote`: el request de cotización con 2 ítems sigue siendo Ida + IdaVuelta (1+2).
 */

/** Clave yyyy-MM-dd para comparar patas ida/vuelta. */
export function departureDateKey(departureDate: string | undefined | null): string | null {
  if (!departureDate) return null;
  return departureDate.slice(0, 10);
}

/**
 * Ida y vuelta con fecha de reserva distinta → combo "dos idas": el validador espera
 * `ReserveTypeId` Ida (1) en ambas patas (alineado con RoundTripSameDayOnly / pricing).
 */
export function isRoundTripDifferentDays(
  outbound: Pick<ReserveSummaryItem, 'DepartureDate'> | null | undefined,
  ret: Pick<ReserveSummaryItem, 'DepartureDate'> | null | undefined,
): boolean {
  const a = departureDateKey(outbound?.DepartureDate);
  const b = departureDateKey(ret?.DepartureDate);
  return !!a && !!b && a !== b;
}

/**
 * Tipo pedido para la pata de vuelta al cotizar (y fallback del submit si aún no hay quote).
 * Mismo día: clásico Ida + IdaVuelta (2 en la vuelta).
 */
export function defaultReturnRequestedReserveTypeId(
  outbound: Pick<ReserveSummaryItem, 'DepartureDate'> | null | undefined,
  ret: Pick<ReserveSummaryItem, 'DepartureDate'> | null | undefined,
): 1 | 2 {
  return isRoundTripDifferentDays(outbound, ret) ? 1 : 2;
}

/** Usa el tipo que aplicó el cotizador; si no viene, el fallback (calendario o 1 en ida). */
export function reserveTypeIdFromQuoteApplied(
  applied: number | undefined,
  fallback: 1 | 2,
): 1 | 2 {
  if (applied === 1 || applied === 2) return applied;
  return fallback;
}
