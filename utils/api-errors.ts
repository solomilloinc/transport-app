// Compat: el extractor de código vive ahora en `lib/apiErrors.ts` (fuente única).
// Este módulo re-exporta `getApiErrorCode` y conserva los helpers de reintento de
// precio usados por los flujos de reserva.
import { getApiErrorCode, ActionResult } from '@/lib/apiErrors';

export { getApiErrorCode };

export const RESERVE_ERROR = {
  PRICE_NOT_AVAILABLE: 'Reserve.PriceNotAvailable',
  OVERPAYMENT_NOT_ALLOWED: 'Reserve.OverPaymentNotAllowed',
} as const;

/**
 * Reintenta una vez cuando el backend rechaza con `Reserve.PriceNotAvailable`
 * (precio stale del lado cliente). `refetchPrice` refresca la data del trip para
 * que `buildPayload` reconstruya el payload con la tarifa vigente. Cualquier
 * otro error se devuelve tal cual (ni retry ni throw).
 *
 * `doPost` es un Server Action (`ActionResult<TResult>`, ver `lib/apiErrors.ts`)
 * en vez de una promesa que puede lanzar: antes este helper relanzaba
 * (`throw err`) el error de `post()` llamado directo desde el cliente, lo que
 * cruza el límite RPC client→server sin capturar y se enmascara en producción.
 * Devolviendo siempre un `ActionResult`, el código nunca se pierde.
 */
export async function withPriceRetry<TPayload, TResult>(
  doPost: (payload: TPayload) => Promise<ActionResult<TResult>>,
  buildPayload: () => TPayload | Promise<TPayload>,
  refetchPrice: () => Promise<void>,
): Promise<ActionResult<TResult>> {
  const first = await doPost(await buildPayload());
  if (first.ok) return first;
  if (first.code === RESERVE_ERROR.PRICE_NOT_AVAILABLE) {
    await refetchPrice();
    return await doPost(await buildPayload());
  }
  return first;
}
