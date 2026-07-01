'use server';

import { put } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';

export interface TripPricesBulkUpdatePayload {
  priceUpdates: { reserveTypeId: number; percentage: number }[];
}

export async function bulkUpdateTripPricesAction(
  data: TripPricesBulkUpdatePayload,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put('/trip-prices-update-percentage', data));
}
