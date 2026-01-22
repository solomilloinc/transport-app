'use server';

import { PagedResponse, PaginationParams } from "./types";
import { withDefaultPagination } from "@/utils/pagination";
import { get, getPure } from "./api";
import { Trip } from "@/interfaces/trip";

export async function getTrips(params: Partial<PaginationParams>): Promise<PagedResponse<Trip>> {
  const finalParams = withDefaultPagination(params);
  return await get<any, PagedResponse<Trip>>('/trip-report', finalParams);
}

export async function getTripById(tripId: number): Promise<Trip> {
  console.log('[getTripById] Fetching tripId:', tripId);
  return await getPure<Trip>(`/trip/${tripId}`);
}

export async function getTripsForSelect(params?: Partial<PaginationParams>): Promise<PagedResponse<Trip>> {
  const finalParams = withDefaultPagination({ pageSize: 100, ...params });
  return await get<any, PagedResponse<Trip>>('/trip-report', finalParams);
}
