'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';

export interface ReservePricePayload {
  OriginId: number;
  DestinationId: number;
  Price: string | number;
  reserveTypeId: string | number;
}

export async function createReservePriceAction(
  data: ReservePricePayload,
): Promise<ActionResult<number>> {
  return runServerAction(() => post('/price-add', data));
}

export async function updateReservePriceAction(
  priceId: number,
  data: ReservePricePayload,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/price-update/${priceId}`, data));
}

export async function deleteReservePriceAction(priceId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/price-delete/${priceId}`));
}
