'use server';

import {
  createFrequentSubscription,
  updateFrequentSubscription,
  cancelFrequentSubscription,
  getFrequentSubscriptionCancelPreview,
} from '@/services/frequentSubscription';
import { ActionResult, runServerAction } from '@/lib/apiErrors';
import type {
  FrequentSubscriptionCreateRequest,
  FrequentSubscriptionUpdateRequest,
  FrequentSubscriptionCancelPreview,
} from '@/interfaces/frequentSubscription';

/**
 * Devuelven el error como VALOR (`runServerAction`) para que los códigos de
 * `FrequentSubscription.*` / `Service.*` / `Customer.NotFound` (ver
 * `lib/apiErrors.ts` → `API_ERROR_CATALOG`) lleguen al usuario también en
 * producción — hoy `services/frequentSubscription.ts` deja que el throw de
 * `services/api.ts` cruce sin capturar desde el Client Component.
 */
export async function createFrequentSubscriptionAction(
  request: FrequentSubscriptionCreateRequest,
): Promise<ActionResult<number>> {
  return runServerAction(() => createFrequentSubscription(request));
}

export async function updateFrequentSubscriptionAction(
  id: number,
  request: FrequentSubscriptionUpdateRequest,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => updateFrequentSubscription(id, request));
}

export async function cancelFrequentSubscriptionAction(id: number): Promise<ActionResult<void>> {
  return runServerAction(() => cancelFrequentSubscription(id));
}

/**
 * Es una lectura (no muta), pero el caller RAMIFICA por código de error
 * (`AlreadyCancelled` / `NotFound` cierran el modal distinto que el resto), así
 * que también necesita el código intacto en producción.
 */
export async function getFrequentSubscriptionCancelPreviewAction(
  id: number,
): Promise<ActionResult<FrequentSubscriptionCancelPreview>> {
  return runServerAction(() => getFrequentSubscriptionCancelPreview(id));
}
