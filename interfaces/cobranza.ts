/**
 * Espejo del contrato de **Cobranza — Pagos y Caja**
 * (`transport-api/docs/frontend/cobranza-pagos-caja-api.md`).
 *
 * Distinto de la Reportería de reservas: mismo namespace de infra, otro dominio
 * (caja) y otra auth (Admin + Operator). Nombres de campo = espejo del wire.
 */

import { PaymentMethod } from '@/interfaces/payment';

export type CobranzaFamily = 'payments' | 'report';

// ─── Métodos de pago ─────────────────────────────────────────────────────────
// ⚠️ NO existe "QR": un cobro por QR de MercadoPago entra como Online (2).

export const COBRANZA_METHOD_LABELS: Record<number, string> = {
  [PaymentMethod.Efectivo]: 'Efectivo',
  [PaymentMethod.Online]: 'Online (incl. QR)',
  [PaymentMethod.Tarjeta]: 'Tarjeta',
  [PaymentMethod.Transferencia]: 'Transferencia',
  [PaymentMethod.AccountCredit]: 'Saldo a favor',
};

// ─── Estado de pago ──────────────────────────────────────────────────────────

export enum PaymentStatus {
  Pendiente = 1,
  Pagado = 2,
  Cancelado = 3,
  Reintegrado = 4,
  Prepago = 5,
}

export const PAYMENT_STATUS_LABELS: Record<number, string> = {
  [PaymentStatus.Pendiente]: 'Pendiente',
  [PaymentStatus.Pagado]: 'Pagado',
  [PaymentStatus.Cancelado]: 'Cancelado',
  [PaymentStatus.Reintegrado]: 'Reintegrado',
  [PaymentStatus.Prepago]: 'Prepago',
};

// ─── Estado de caja (string en el wire) ──────────────────────────────────────

export type CashBoxStatus = 'Open' | 'Closed';

export const CASHBOX_STATUS_LABELS: Record<CashBoxStatus, string> = {
  Open: 'Abierta',
  Closed: 'Cerrada',
};

// ─── Reporte de Pagos (grano método) ─────────────────────────────────────────

export interface PaymentRow {
  paymentId: number;
  date: string; // hora local de operación
  method: number; // PaymentMethod
  amount: number;
  status: number; // PaymentStatus
  cashBoxId: number;
  reserveId: number | null;
  customerId: number | null;
  payerName: string;
  payerDocumentNumber: string;
  payerEmail: string;
}

export interface CobranzaMethodBucket {
  key: number;
  label: string;
  count: number;
  amount: number;
}

export interface PaymentsSummary {
  totals: { count: number; amount: number };
  byMethod: CobranzaMethodBucket[];
}

// ─── Reporte de Caja (grano caja) ────────────────────────────────────────────
// La fila es el `CashBox` que ya existe en interfaces/cash-box.ts.

/** ⚠️ Shape distinto al bucket de Pagos (DTOs de áreas distintas). */
export interface CashBoxMethodBucket {
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
}

export interface CashBoxesSummary {
  cashBoxesCount: number;
  paymentsCount: number;
  totalAmount: number;
  byMethod: CashBoxMethodBucket[];
}
