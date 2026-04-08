'use server';

import { PagedResponse, PaginationParams } from "./types";
import { withDefaultPagination } from "@/utils/pagination";
import { get, getPure } from "./api";
import { Trip } from "@/interfaces/trip";
import { TripReportFilters } from "@/interfaces/filters/trip-filters";

export async function getTrips(
  params: Partial<PaginationParams> & { filters?: TripReportFilters }
): Promise<PagedResponse<Trip>> {
  const finalParams = withDefaultPagination(params);
  return await get<TripReportFilters, PagedResponse<Trip>>('/trip-report', finalParams);
}

export async function getTripById(tripId: number, reserveId?: number): Promise<Trip> {
  console.log('[getTripById] Fetching tripId:', tripId, 'reserveId:', reserveId);
  const queryParams = reserveId ? `?reserveId=${reserveId}` : '';
  return await getPure<Trip>(`/trip/${tripId}${queryParams}`);
}

export async function getTripsForSelect(params?: Partial<PaginationParams>): Promise<PagedResponse<Trip>> {
  const finalParams = withDefaultPagination({ pageSize: 100, ...params });
  return await get<any, PagedResponse<Trip>>('/trip-report', finalParams);
}

// Public Trip DTO for landing page
export interface PublicTripDto {
  TripId: number;
  Description: string;
  OriginCityId: number;
  OriginCityName: string;
  DestinationCityId: number;
  DestinationCityName: string;
  PriceFrom: number | null;
  EstimatedDuration: string | null;
}

// Get public trips for landing page (no auth required)
export async function getPublicTrips(pageNumber = 1, pageSize = 100): Promise<PagedResponse<PublicTripDto>> {
  return await getPure<PagedResponse<PublicTripDto>>(
    '/public/trips',
    { pageNumber, pageSize },
    { skipAuth: true }
  );
}
