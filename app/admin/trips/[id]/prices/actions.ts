'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';

export interface TripPriceUpsertPayload {
  tripId?: number;
  cityId: number;
  directionId: number | null;
  reserveTypeId: number;
  Price: number;
  Order: number;
}

export async function createTripPriceAction(
  data: TripPriceUpsertPayload,
): Promise<ActionResult<number>> {
  return runServerAction(() => post('/trip-price-add', data));
}

export async function updateTripPriceAction(
  tripPriceId: number,
  data: Omit<TripPriceUpsertPayload, 'tripId'>,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/trip-price-update/${tripPriceId}`, data));
}

export async function deleteTripPriceAction(tripPriceId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/trip-price-delete/${tripPriceId}`));
}
