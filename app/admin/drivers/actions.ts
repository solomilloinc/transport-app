'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';
import type { emptyDriver } from '@/interfaces/driver';

export type DriverPayload = typeof emptyDriver;

export async function createDriverAction(data: DriverPayload): Promise<ActionResult<number>> {
  return runServerAction(() => post('/driver-create', data));
}

export async function updateDriverAction(
  driverId: number,
  data: DriverPayload,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/driver-update/${driverId}`, data));
}

export async function deleteDriverAction(driverId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/driver-delete/${driverId}`));
}
