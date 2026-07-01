'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';
import type { emptyCity } from '@/interfaces/city';

export type CityPayload = typeof emptyCity;

export async function createCityAction(data: CityPayload): Promise<ActionResult<number>> {
  return runServerAction(() => post('/city-create', data));
}

export async function updateCityAction(
  cityId: number,
  data: CityPayload,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/city-update/${cityId}`, data));
}

export async function deleteCityAction(cityId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/city-delete/${cityId}`));
}
