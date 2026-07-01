'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';
import type { emptyVehicle } from '@/interfaces/vehicle';

export type VehiclePayload = typeof emptyVehicle;

export async function createVehicleAction(data: VehiclePayload): Promise<ActionResult<number>> {
  return runServerAction(() => post('/vehicle-create', data));
}

export async function updateVehicleAction(
  vehicleId: number,
  data: VehiclePayload,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/vehicle-update/${vehicleId}`, data));
}

export async function deleteVehicleAction(vehicleId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/vehicle-delete/${vehicleId}`));
}
