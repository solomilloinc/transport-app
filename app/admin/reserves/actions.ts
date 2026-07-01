'use server';

import { post, put, deleteLogic } from '@/services/api';
import { getApiErrorMessage, FALLBACK_MESSAGE, ActionResult, runServerAction } from '@/lib/apiErrors';
import { ReserveStatusEnum, ReserveUpdate } from '@/interfaces/reserve';
import { PassengerReserveUpdate, PassengerReserveCreateRequestWrapper } from '@/interfaces/passengerReserve';
import { ReservePaymentsCreateRequest } from '@/interfaces/payment';

/**
 * Resultado normalizado de cancelar un viaje/reserva.
 *
 * Devolvemos el error como VALOR en vez de relanzarlo a propósito: un throw no
 * capturado en un Server Action se convierte en un 500 y, en producción, Next.js
 * enmascara el `message` del Error (sólo cruza el `digest`). Si dejáramos que el
 * `Error('API_ERROR:<code>')` de `services/api.ts` saliera del action, el código
 * del backend nunca llegaría al catálogo (`lib/apiErrors.ts`) en prod y el
 * usuario sólo vería el mensaje base. Resolviéndolo acá, el código y el copy
 * viajan intactos tanto en dev como en prod.
 */
export type CancelReserveResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export async function cancelReserveTripAction(
  reserveId: number,
): Promise<CancelReserveResult> {
  const payload: ReserveUpdate = {
    vehicleId: null,
    driverId: null,
    reserveDate: null,
    departureHour: null,
    status: ReserveStatusEnum.Cancelled,
  };

  try {
    const ok = await put(`/reserve-update/${reserveId}`, payload);
    if (!ok) {
      // El backend respondió 200 pero sin confirmar la cancelación.
      return { ok: false, code: '', message: FALLBACK_MESSAGE };
    }
    return { ok: true };
  } catch (error) {
    const info = getApiErrorMessage(error);
    return { ok: false, code: info.code ?? '', message: info.message };
  }
}

/**
 * Resultado normalizado de cancelar un Pasajero. Mismo motivo que arriba para
 * devolver el error como VALOR: el `message` de un Error lanzado desde un Server
 * Action se enmascara en prod, así que el `code` del backend nunca llegaría al
 * catálogo. Resolviéndolo acá, code + copy viajan intactos.
 */
export type PassengerActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export interface CancelPassengerRequest {
  createCreditBalance: boolean;
  cancelScope: 1 | 2; // 1 = FullRoundTrip, 2 = SelectedLegOnly
}

/** Cancela un Pasajero individual (passenger-cancel). */
export async function cancelPassengerAction(
  passengerId: number,
  request: CancelPassengerRequest,
): Promise<PassengerActionResult> {
  try {
    const ok = await post(`/passenger-cancel/${passengerId}`, request);
    if (!ok) return { ok: false, code: '', message: FALLBACK_MESSAGE };
    return { ok: true };
  } catch (error) {
    const info = getApiErrorMessage(error);
    return { ok: false, code: info.code ?? '', message: info.message };
  }
}

/** Edita vehículo/hora/estado de un viaje (EditTripDialog). Distinto de
 * `cancelReserveTripAction`, que sólo cancela. */
export async function updateReserveTripAction(
  reserveId: number,
  payload: ReserveUpdate,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/reserve-update/${reserveId}`, payload));
}

/**
 * Eliminar (destructivo, `customer-reserve-delete`) — distinto de Cancelar
 * (`passenger-cancel`, ver `cancelPassengerAction`): borra sin dejar rastro,
 * el operador elige el destino del dinero. Ver CONTEXT.md.
 */
export async function deletePassengerReserveAction(passengerId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/customer-reserve-delete/${passengerId}`));
}

/** Edita subida/bajada de un Passenger (EditPassengerReserveDialog). */
export async function updatePassengerReserveAction(
  passengerId: number,
  payload: PassengerReserveUpdate,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/passenger-reserve-update/${passengerId}`, payload));
}

/**
 * Alta administrativa de reserva (AddReservationFlow, `passenger-reserves-create`).
 * Se usa junto con `withPriceRetry` (utils/api-errors.ts): ese helper reintenta
 * una vez con esta misma action si el backend rechaza por precio stale, y
 * devuelve el `ActionResult` final sin relanzar — ver comentario ahí.
 */
export async function createPassengerReserveAction(
  payload: PassengerReserveCreateRequestWrapper,
): Promise<ActionResult<number>> {
  return runServerAction(() => post('/passenger-reserves-create', payload));
}

/** Carga uno o más pagos + saldo a favor sobre un Passenger (AddPaymentDialog). */
export async function addReservePaymentAction(
  reserveId: number,
  customerId: number,
  passengerId: number,
  payload: ReservePaymentsCreateRequest,
): Promise<ActionResult<number>> {
  return runServerAction(() =>
    post(
      `/reserve-payments-create/${reserveId}/${customerId}?passengerId=${passengerId}`,
      payload,
    ),
  );
}
