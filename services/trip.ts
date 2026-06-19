'use server';

import { unstable_cache } from "next/cache";
import { PagedResponse, PaginationParams } from "./types";
import { withDefaultPagination } from "@/utils/pagination";
import { get, getPure } from "./api";
import { Trip } from "@/interfaces/trip";
import { TripReportFilters } from "@/interfaces/filters/trip-filters";
import { getRequestHost } from "@/lib/get-host";
import { getTenantHeaders } from "@/services/tenant-headers";

export async function getTrips(
  params: Partial<PaginationParams> & { filters?: TripReportFilters }
): Promise<PagedResponse<Trip>> {
  const finalParams = withDefaultPagination(params);
  return await get<TripReportFilters, PagedResponse<Trip>>('/trip-report', finalParams);
}

export async function getTripById(tripId: number, reserveId?: number): Promise<Trip> {
  const queryParams = reserveId ? `?reserveId=${reserveId}` : '';
  return await getPure<Trip>(`/trip/${tripId}${queryParams}`);
}

export async function getTripsForSelect(params?: Partial<PaginationParams>): Promise<PagedResponse<Trip>> {
  const finalParams = withDefaultPagination({ pageSize: 100, ...params });
  return await get<any, PagedResponse<Trip>>('/trip-report', finalParams);
}

// Public Trip DTO for landing page
export interface PublicTripDto {
  tripId: number;
  description: string;
  originCityId: number;
  originCityName: string;
  destinationCityId: number;
  destinationCityName: string;
  priceFrom: number | null;
  estimatedDuration: string | null;
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7215/api';

// Trips/prices son catálogo (cambian poco). El listado público no depende de la
// sesión, sólo del tenant, así que lo cacheamos en el Data Cache de Next por
// `tenantCode` + paginación. Sin esto, como la landing se renderiza dinámicamente
// (layout/axios leen el host header), `GetPublicTrips` se golpeaba en CADA visita.
// El TTL acota la staleness: una edición del admin se refleja sola en <= PUBLIC_TRIPS_TTL.
// El tag `public-trips` permite invalidar a mano vía `revalidateTag('public-trips')`.
const PUBLIC_TRIPS_TTL = 60 * 10; // 10 min

// IMPORTANTE: la función cacheada NO puede leer headers()/cookies() (unstable_cache
// lo prohíbe). Por eso resolvemos el tenant afuera y se lo pasamos como argumento;
// adentro sólo hacemos un fetch público con el header X-Tenant-Code.
const getCachedPublicTrips = unstable_cache(
  async (
    tenantCode: string,
    pageNumber: number,
    pageSize: number
  ): Promise<PagedResponse<PublicTripDto>> => {
    const res = await fetch(
      `${BACKEND_URL}/public/trips?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      { headers: tenantCode ? { 'X-Tenant-Code': tenantCode } : {} }
    );
    if (!res.ok) {
      // No cacheamos errores: unstable_cache no almacena promesas rechazadas.
      throw new Error(`public/trips request failed: ${res.status}`);
    }
    return res.json();
  },
  ['public-trips'],
  { revalidate: PUBLIC_TRIPS_TTL, tags: ['public-trips'] }
);

// Get public trips for landing page (no auth required)
export async function getPublicTrips(pageNumber = 1, pageSize = 100): Promise<PagedResponse<PublicTripDto>> {
  // Resolvemos el tenant fuera del cache (lee el host header) y lo pasamos como
  // arg: unstable_cache incluye los argumentos en la cache key → cache por-tenant.
  const host = await getRequestHost();
  const tenantHeaders = await getTenantHeaders(host);
  const tenantCode = tenantHeaders['X-Tenant-Code'] ?? '';
  return getCachedPublicTrips(tenantCode, pageNumber, pageSize);
}
