'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';

export interface TripPickupStopUpsertPayload {
  tripId?: number;
  directionId: number;
  Order: number;
  pickupTimeOffset: string;
}

export async function createTripPickupStopAction(
  data: TripPickupStopUpsertPayload,
): Promise<ActionResult<number>> {
  return runServerAction(() => post('/trip-pickup-stop-create', data));
}

export async function updateTripPickupStopAction(
  tripPickupStopId: number,
  data: Omit<TripPickupStopUpsertPayload, 'tripId'>,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/trip-pickup-stop-update/${tripPickupStopId}`, data));
}

export async function deleteTripPickupStopAction(
  tripPickupStopId: number,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/trip-pickup-stop-delete/${tripPickupStopId}`));
}
