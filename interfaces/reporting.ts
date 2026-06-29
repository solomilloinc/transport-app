/**
 * Espejo del contrato de **Reportería de reservas**
 * (`transport-api/docs/frontend/reporteria-reservas-api.md`).
 *
 * Regla de oro (ver CONTEXT.md → "Idioma del contrato"): los **nombres de campo**
 * van en inglés, espejo exacto del wire. NO remapear a español: sólo los `label`
 * que vienen del backend y los textos de display que ponemos nosotros van en
 * español. Mapas de label/estado canónicos viven acá para usarse SÓLO al render.
 */

import { PaymentMethod } from '@/interfaces/payment';

/** Dimensión de fecha sobre la que corre el reporte. */
export type ReportingDateField = 'travel' | 'sale';

export type ReportingFamily = 'passengers' | 'reserves';

// ─── Estados ────────────────────────────────────────────────────────────────

export enum PassengerStatus {
  PendingPayment = 1,
  Confirmed = 2,
  Cancelled = 3,
  Traveled = 4,
}

export const PASSENGER_STATUS_LABELS: Record<number, string> = {
  [PassengerStatus.PendingPayment]: 'Pendiente de pago',
  [PassengerStatus.Confirmed]: 'Confirmado',
  [PassengerStatus.Cancelled]: 'Cancelado',
  [PassengerStatus.Traveled]: 'Viajó',
};

/** Default del backend cuando se omite `statuses` (charter §0.3). */
export const PASSENGER_STATUS_DEFAULT: number[] = [1, 2, 3, 4];

export enum ReserveStatus {
  Available = 0,
  Confirmed = 1,
  Cancelled = 2,
  Completed = 3,
  Rejected = 4,
  Expired = 5,
}

export const RESERVE_STATUS_LABELS: Record<number, string> = {
  [ReserveStatus.Available]: 'Disponible',
  [ReserveStatus.Confirmed]: 'Confirmada',
  [ReserveStatus.Cancelled]: 'Cancelada',
  [ReserveStatus.Completed]: 'Completada',
  [ReserveStatus.Rejected]: 'Rechazada',
  [ReserveStatus.Expired]: 'Expirada',
};

/** Default del backend cuando se omite `statuses` (charter §0.3). Excluye Available/Rejected/Expired. */
export const RESERVE_STATUS_DEFAULT: number[] = [1, 2, 3];

// ─── Método de pago (filtro del reporte por pasajero) ────────────────────────

export const PAYMENT_METHOD_LABELS: Record<number, string> = {
  [PaymentMethod.Efectivo]: 'Efectivo',
  [PaymentMethod.Online]: 'Online',
  [PaymentMethod.Tarjeta]: 'Tarjeta',
  [PaymentMethod.Transferencia]: 'Transferencia',
  [PaymentMethod.AccountCredit]: 'Saldo a favor',
};

// ─── Grilla: items ───────────────────────────────────────────────────────────

export interface ReportingPassengerRow {
  passengerId: number;
  reserveId: number;
  tripId: number;
  tripName: string;
  originName: string;
  destinationName: string;
  reserveDate: string;
  departureHour: string;
  fullName: string;
  documentNumber: string;
  email: string;
  phone: string;
  status: number; // PassengerStatus
  hasTraveled: boolean;
  isFrequent: boolean;
  customerId: number | null;
  price: number;
  paymentMethod: string | null; // label del método; null si no pagó
  currentBalance: number | null;
  overdueBalance: number | null;
}

export interface ReportingReserveRow {
  reserveId: number;
  tripId: number;
  tripName: string;
  originName: string;
  destinationName: string;
  reserveDate: string;
  departureHour: string;
  status: number; // ReserveStatus
  isHoliday: boolean;
  vehicleId: number;
  internalNumber: string;
  driverId: number;
  capacity: number;
  reservedCount: number;
  availableCount: number;
  occupancyPct: number;
  soldAmount: number;
  collectedAmount: number;
}

// ─── Summary: buckets ────────────────────────────────────────────────────────

export interface ReportingStatusBucket {
  status: number;
  label: string;
  count: number;
}

export interface ReportingPaymentMethodBucket {
  method: number;
  label: string;
  count: number;
  soldAmount: number;
}

export interface ReportingRouteBucket {
  tripId: number;
  tripName: string;
  count: number;
  soldAmount?: number;
}

export interface ReportingDayBucket {
  date: string;
  count: number;
  soldAmount?: number;
}

export interface ReportingOccupancyBucket {
  range: string;
  count: number;
}

// ─── Summary: por pasajero ───────────────────────────────────────────────────

export interface ReportingPassengersTotals {
  passengers: number;
  withCustomer: number;
  frequent: number;
  traveled: number;
  soldAmount: number; // NETO de cancelados
  collectedAmount: number; // NETO de cancelados
  debt: number;
  cancelled: number; // conteo de cancelados
  cancelledAmount: number; // monto dado de baja (no suma en soldAmount)
}

export interface ReportingPassengersSummary {
  totals: ReportingPassengersTotals;
  byStatus: ReportingStatusBucket[];
  byPaymentMethod: ReportingPaymentMethodBucket[];
  byRoute: ReportingRouteBucket[];
  byDay: ReportingDayBucket[];
}

// ─── Summary: por reserva ────────────────────────────────────────────────────

export interface ReportingReservesTotals {
  reserves: number;
  passengers: number;
  capacity: number;
  averageOccupancyPct: number;
  soldAmount: number;
  collectedAmount: number;
}

export interface ReportingReservesSummary {
  totals: ReportingReservesTotals;
  byStatus: ReportingStatusBucket[];
  byRoute: ReportingRouteBucket[];
  byDay: ReportingDayBucket[];
  occupancyDistribution: ReportingOccupancyBucket[];
}
