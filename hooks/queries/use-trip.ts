'use client';

import { useQuery } from '@tanstack/react-query';
import { getTripById } from '@/services/trip';
import type { Trip } from '@/interfaces/trip';

/**
 * Lecturas de Trip vía React Query sobre la Server Action existente
 * (`getTripById`). Carril 2 del estándar de data-fetching — ver docs/adr/0006.
 *
 * Reusa toda la auth/tenant centralizada en services/axios.ts: el queryFn sólo
 * invoca la Server Action; React Query agrega dedupe + cache + colapso de
 * requests del lado del cliente.
 */

/** TTL para datos de catálogo (trips/precios públicos): cambian poco. */
export const STALE_TRIP_CATALOG = 10 * 60_000;

export const tripKeys = {
  all: ['trip'] as const,
  detail: (tripId?: number, reserveId?: number) =>
    [...tripKeys.all, tripId ?? null, reserveId ?? null] as const,
};

interface UseTripOptions {
  /** Gate extra además de tener tripId (ej. dialog abierto). Default true. */
  enabled?: boolean;
  /**
   * Override del staleTime. Catálogo público → STALE_TRIP_CATALOG; data
   * por-reserva (precios editables en admin) → 0 para garantizar frescura.
   */
  staleTime?: number;
}

export function useTrip(tripId?: number, reserveId?: number, options?: UseTripOptions) {
  return useQuery<Trip>({
    queryKey: tripKeys.detail(tripId, reserveId),
    queryFn: () => getTripById(tripId!, reserveId),
    enabled: !!tripId && (options?.enabled ?? true),
    staleTime: options?.staleTime,
  });
}
