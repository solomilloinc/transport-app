// Compat: el extractor de código vive ahora en `lib/apiErrors.ts` (fuente única).
// Este módulo re-exporta `getApiErrorCode` y conserva los helpers de reintento de
// precio usados por los flujos de reserva.
import { getApiErrorCode } from '@/lib/apiErrors';

export { getApiErrorCode };

export const RESERVE_ERROR = {
  PRICE_NOT_AVAILABLE: 'Reserve.PriceNotAvailable',
  OVERPAYMENT_NOT_ALLOWED: 'Reserve.OverPaymentNotAllowed',
} as const;

// Retries a POST once when the backend rejects with Reserve.PriceNotAvailable
// (stale client-side price). `refetchPrice` is expected to refresh the trip
// data so that `buildPayload` rebuilds the payload with the server's current
// tariff. Any other error rethrows.
export async function withPriceRetry<TPayload, TResult>(
  doPost: (payload: TPayload) => Promise<TResult>,
  buildPayload: () => TPayload | Promise<TPayload>,
  refetchPrice: () => Promise<void>,
): Promise<TResult> {
  try {
    return await doPost(await buildPayload());
  } catch (err) {
    if (getApiErrorCode(err) === RESERVE_ERROR.PRICE_NOT_AVAILABLE) {
      await refetchPrice();
      return await doPost(await buildPayload());
    }
    throw err;
  }
}
