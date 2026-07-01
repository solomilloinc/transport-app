'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';

export interface TripUpsertPayload {
  Description: string;
  originCityId: number;
  destinationCityId: number;
}

export async function createTripAction(data: TripUpsertPayload): Promise<ActionResult<number>> {
  return runServerAction(() => post('/trip-create', data));
}

export async function updateTripAction(
  tripId: number,
  data: TripUpsertPayload,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/trip-update/${tripId}`, data));
}

export async function deleteTripAction(tripId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/trip-delete/${tripId}`));
}
