'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';
import type { emptyDirection } from '@/interfaces/direction';

export type DirectionPayload = typeof emptyDirection;

export async function createDirectionAction(data: DirectionPayload): Promise<ActionResult<number>> {
  return runServerAction(() => post('/direction-create', data));
}

export async function updateDirectionAction(
  directionId: number,
  data: DirectionPayload,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/direction-update/${directionId}`, data));
}

export async function deleteDirectionAction(directionId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/direction-delete/${directionId}`));
}
