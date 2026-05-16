export const RESERVE_ERROR = {
  PRICE_NOT_AVAILABLE: 'Reserve.PriceNotAvailable',
  OVERPAYMENT_NOT_ALLOWED: 'Reserve.OverPaymentNotAllowed',
} as const;

export function getApiErrorCode(error: unknown): string {
  if (error instanceof Error && error.message.startsWith('API_ERROR:')) {
    return error.message.replace('API_ERROR:', '');
  }
  return '';
}

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
