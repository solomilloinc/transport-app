'use server';

import { post, put, deleteLogic } from '@/services/api';
import {
  getCustomerPendingReserves,
  settleCustomerDebt,
  createCustomerAccountAdjustment,
  refundPaymentCash,
} from '@/services/customerAccount';
import { ActionResult, runServerAction } from '@/lib/apiErrors';
import type { Passenger } from '@/interfaces/passengers';
import type {
  PendingReserve,
  CustomerDebtSettleRequest,
  CustomerAccountAdjustmentRequest,
} from '@/interfaces/customerAccount';

/**
 * Compartido por `app/admin/customers/list/page.tsx` (ABM completo) y
 * `components/admin/reserves/NewClientDialog.tsx` (alta rápida inline en el
 * flujo de reserva) — mismo endpoint, mismo shape de payload.
 *
 * Devuelven el error como VALOR (`runServerAction`) para que el código del
 * backend (ej. `Customer.AlreadyExists` al repetir un documento) llegue al
 * catálogo también en producción — ver `lib/apiErrors.ts` → `ActionResult`.
 */
export type CustomerPayload = Omit<Passenger, 'customerId' | 'email'> & { email: string | null };

export async function createCustomerAction(data: CustomerPayload): Promise<ActionResult<number>> {
  return runServerAction(() => post('/customer-create', data));
}

export async function updateCustomerAction(
  customerId: number,
  data: CustomerPayload,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/customer-update/${customerId}`, data));
}

export async function deleteCustomerAction(customerId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/customer-delete/${customerId}`));
}

// ── Cuenta corriente (services/customerAccount.ts) ──────────────────────────
// Mismo motivo/patrón que arriba: estas funciones son llamadas directo desde
// Client Components (DebtSettlementDialog, customers/debts/page.tsx) y dejaban
// que el throw de `services/api.ts` cruzara sin capturar.

export async function getCustomerPendingReservesAction(
  customerId: number,
): Promise<ActionResult<PendingReserve[]>> {
  return runServerAction(() => getCustomerPendingReserves(customerId));
}

export async function settleCustomerDebtAction(
  request: CustomerDebtSettleRequest,
): Promise<ActionResult<{ isSuccess: boolean; value: boolean }>> {
  return runServerAction(() => settleCustomerDebt(request));
}

export async function createCustomerAccountAdjustmentAction(
  customerId: number,
  request: CustomerAccountAdjustmentRequest,
): Promise<ActionResult<{ isSuccess: boolean; value: boolean }>> {
  return runServerAction(() => createCustomerAccountAdjustment(customerId, request));
}

export async function refundPaymentCashAction(
  reservePaymentId: number,
): Promise<ActionResult<{ isSuccess: boolean; value: boolean }>> {
  return runServerAction(() => refundPaymentCash(reservePaymentId));
}
