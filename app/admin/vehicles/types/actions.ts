'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';
import type { VehicleType } from '@/interfaces/vehicleType';

export async function createVehicleTypeAction(data: VehicleType): Promise<ActionResult<number>> {
  return runServerAction(() => post('/vehicle-type-create', data));
}

export async function updateVehicleTypeAction(
  vehicleTypeId: number,
  data: VehicleType,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/vehicle-type-update/${vehicleTypeId}`, data));
}

export async function deleteVehicleTypeAction(vehicleTypeId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/vehicle-type-delete/${vehicleTypeId}`));
}
