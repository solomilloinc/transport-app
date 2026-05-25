import { EntityStatus } from './filters/common';

/**
 * Espejo de `Transport.Domain.Enums.ReserveTypeEnum` del backend.
 * Determina si una suscripción cubre solo Ida o también Vuelta.
 */
export enum ReserveType {
  Ida = 1,
  IdaVuelta = 2,
}

export const RESERVE_TYPE_OPTIONS: Array<{ value: ReserveType; label: string }> = [
  { value: ReserveType.Ida, label: 'Ida' },
  { value: ReserveType.IdaVuelta, label: 'Ida y Vuelta' },
];

/**
 * Payload para POST /api/frequent-subscription-create.
 * Wire format = camelCase.
 */
export interface FrequentSubscriptionCreateRequest {
  customerId: number;
  reserveTypeId: ReserveType;

  outboundServiceId: number;
  outboundPickupLocationId: number;
  outboundDropoffLocationId: number;

  inboundServiceId: number | null;
  inboundPickupLocationId: number | null;
  inboundDropoffLocationId: number | null;

  /** ISO yyyy-mm-dd */
  startDate: string;
  /** ISO yyyy-mm-dd | null = sin fin */
  endDate: string | null;
}

/**
 * Payload para PUT /api/frequent-subscription-update/{id}.
 * Solo pickup/dropoff (4 campos), fechas y status no editable acá.
 * customerId / reserveType / services son inmutables (cambiar = cancel + recrear).
 */
export interface FrequentSubscriptionUpdateRequest {
  outboundPickupLocationId: number;
  outboundDropoffLocationId: number;
  inboundPickupLocationId: number | null;
  inboundDropoffLocationId: number | null;
  startDate: string;
  endDate: string | null;
}

/**
 * Wire format del status en las respuestas de FrequentSubscription.
 *
 * Mayo 2026: el backend serializa el enum como **string** ("Active", "Cancelled")
 * via JsonStringEnumConverter. Aceptamos también la variante numérica
 * (EntityStatus) para tolerar respuestas legacy o de otros endpoints.
 */
export type FrequentSubscriptionStatus = EntityStatus | 'Active' | 'Cancelled' | string;

/**
 * True si el status indica suscripción activa. Resiliente a ambos formatos:
 *   - Numérico: EntityStatus.Active === 1
 *   - String:   "Active" (case-insensitive)
 */
export function isActiveSubscriptionStatus(
  status: FrequentSubscriptionStatus | undefined | null
): boolean {
  if (status == null) return false;
  if (typeof status === 'number') return status === EntityStatus.Active;
  return status.toLowerCase() === 'active';
}

/**
 * Respuesta de:
 *  - GET /api/frequent-subscription/{id}
 *  - PUT /api/frequent-subscription-update/{id}
 *  - items[] de POST /api/frequent-subscription-report
 *
 * Trae también los nombres denormalizados para evitar joins en el cliente.
 */
export interface FrequentSubscriptionResponseDto {
  frequentSubscriptionId: number;

  customerId: number;
  customerFullName: string;

  reserveTypeId: ReserveType;

  outboundServiceId: number;
  outboundServiceName: string;

  inboundServiceId: number | null;
  inboundServiceName: string | null;

  outboundPickupLocationId: number;
  outboundPickupLocationName: string;
  outboundDropoffLocationId: number;
  outboundDropoffLocationName: string;

  inboundPickupLocationId: number | null;
  inboundPickupLocationName: string | null;
  inboundDropoffLocationId: number | null;
  inboundDropoffLocationName: string | null;

  startDate: string;
  endDate: string | null;

  status: FrequentSubscriptionStatus;
}

/**
 * Respuesta de GET /api/frequent-subscription/{id}/cancel-preview.
 * Read-only, idempotente. Usado para poblar el modal de confirmación con
 * números concretos antes de invocar el DELETE.
 *
 * El sistema no trackea moneda hoy (ver FRONTEND_SERVICIOS_CLIENTE.md:103).
 * El frontend asume una sola por tenant y formatea con `$` literal.
 */
export interface FrequentSubscriptionCancelPreview {
  frequentSubscriptionId: number;
  /** Passengers futuros no-viajados que se van a cancelar. */
  passengersToCancel: number;
  /** Suma de Passenger.Price a reembolsar como Refund en CustomerAccountTransaction. */
  totalRefundAmount: number;
}

export const emptyFrequentSubscriptionCreate: FrequentSubscriptionCreateRequest = {
  customerId: 0,
  reserveTypeId: ReserveType.Ida,
  outboundServiceId: 0,
  outboundPickupLocationId: 0,
  outboundDropoffLocationId: 0,
  inboundServiceId: null,
  inboundPickupLocationId: null,
  inboundDropoffLocationId: null,
  startDate: '',
  endDate: null,
};
