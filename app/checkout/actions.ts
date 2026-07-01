'use server';

import { post } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';
import type { CreateReserveWithLockRequest } from '@/interfaces/passengerReserve';

/**
 * Alta pública de reserva (checkout con lock, `passenger-reserves-create-with-lock`).
 * Se usa con `withPriceRetry` (utils/api-errors.ts) para reintentar una vez si el
 * backend rechaza por precio stale — mismo motivo que `createPassengerReserveAction`
 * en `app/admin/reserves/actions.ts`: capturar el error del lado server para que
 * el código llegue intacto también en producción.
 *
 * El tipo de retorno es `unknown` a propósito: el endpoint devuelve el resultado
 * completo, pero a veces serializado como string JSON (quirk del wire actual) —
 * el caller (`app/checkout/page.tsx`) hace el unwrap defensivo igual que antes.
 */
export async function createPublicReserveAction(
  payload: CreateReserveWithLockRequest,
): Promise<ActionResult<unknown>> {
  return runServerAction(() => post('/passenger-reserves-create-with-lock', payload));
}
