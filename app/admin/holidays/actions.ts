'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';

export interface HolidayPayload {
  holidayName: string;
  holidayDate: string;
}

export async function createHolidayAction(data: HolidayPayload): Promise<ActionResult<number>> {
  return runServerAction(() => post('/holiday-create', data));
}

export async function updateHolidayAction(
  holidayId: number,
  data: HolidayPayload,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/holiday-update/${holidayId}`, data));
}

export async function deleteHolidayAction(holidayId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/holiday-delete/${holidayId}`));
}
