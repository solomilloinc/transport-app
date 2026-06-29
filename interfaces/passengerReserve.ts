import { Auditable } from './auditable';
import { Payment } from './payment';
import { ReserveTypeId } from '@/constants/reserveType';

export enum PaymentStatusEnum {
  PendingPayment = 1,
  Confirmed = 2,
  Cancelled = 3,
  Traveled = 4,
  NoShow = 5,
  Refunded = 6,
}

export const PaymentStatusLabels: Record<number, string> = {
  1: 'Pendiente',
  2: 'Confirmado',
  3: 'Cancelado',
  4: 'Viajó',
  5: 'No se presentó',
  6: 'Reembolsado',
};

export interface PassengerReserve extends Auditable {
  passengerId: number;
  reserveId: number;
  customerId: number;
  isPayment: boolean;
  statusPaymentId: number;
  reserveTypeId: number;
  paymentMethod: number;
  paymentMethods: string;
  pickupLocationId: number;
  dropoffLocationId: number;
  hasTraveled: boolean;
  status: number;
  isRoundTrip: boolean;
  payments: Payment[];
  totalAmount: number;
  paidAmount: number;
  pendingDebt: number;
}

export interface PassengerReserveReport extends PassengerReserve {
  fullName: string;
  documentNumber: string;
  pickupLocationName: string;
  dropoffLocationName: string;
  /**
   * Saldo total histórico de cuenta corriente del Cliente (incluye cargos de
   * viajes futuros ya debitados). Backend lo sigue enviando; ya NO se muestra en
   * la columna "debe" — ver `overdueBalance` y CONTEXT.md.
   */
  currentBalance: number;
  /**
   * Deuda vencida: saldo del Cliente SOLO por viajes ya realizados (Reserves ya
   * partidas). Es lo cobrable sin riesgo. `null` ⇒ el Pasajero no tiene Cliente
   * registrado; `0` ⇒ Cliente sin deuda vencida. Ver CONTEXT.md.
   */
  overdueBalance: number | null;
  /**
   * Si está poblado, el Passenger fue auto-creado por el batch a partir de la
   * FrequentSubscription con ese id. Si es null, vino de un alta manual o
   * checkout externo.
   *
   * Permite mostrar un badge "FRECUENTE" en la grilla y (futuro) linkear al
   * detalle de la suscripción origen.
   */
  frequentSubscriptionId: number | null;
  /**
   * `true` ⇒ el Passenger está en stand-by esperando la confirmación de un pago
   * EXTERNO (wallet / MercadoPago): la reserva ya ocupa el asiento pero el webhook
   * todavía no confirmó. El back office NO debe operar sobre él (cancelar, editar,
   * marcar "viajó", cargar pago, saldar deuda, cancelar la reserva) porque choca
   * con la confirmación en camino o genera doble cobro. El backend bloquea estas
   * acciones con el código `Passenger.AwaitingExternalPayment` (ver lib/apiErrors).
   *
   * Importante: un PendingPayment de mostrador (alta del operador, espera cobro en
   * efectivo) viene con `false` y SIGUE siendo accionable — no se bloquea.
   */
  isAwaitingExternalPayment: boolean;
  /**
   * Si está poblado, este Passenger es la pata del package IdaVuelta — su
   * "compañero" en la reserva inversa está identificado por `reserveRelatedId`.
   *
   * Convención Mayo 2026: el outbound del package carga el monto total y el
   * return va a 0 (ver utils/bookingPayload.ts y AddReservationFlow.tsx).
   * Por eso un Passenger con `reserveRelatedId != null && price == 0` no es
   * gratis: es la vuelta del paquete cuyo cobro vive en el outbound.
   *
   * También sirve para `Cancelar`: `reserveRelatedId != null` ⇒ es IdaVuelta ⇒
   * cancelar arrastra las dos piernas → la UI avisa "se cancelan ambos tramos".
   */
  reserveRelatedId: number | null;
  /**
   * `true` ⇒ el Passenger es de un Cliente abonado: viajó sin cobro (acuerdo
   * especial). Su `price`/importe es 0 y no tiene pago asociado por diseño, así
   * que la grilla muestra un tag "Abonado" y NO ofrece acciones de cobro ni deuda
   * pendiente. Ver CONTEXT.md. El backend lo agrega en `passenger-reserve-report`;
   * mientras no esté live puede venir `undefined` (se lee con `=== true`).
   */
  isAbono?: boolean;
}

export interface PassengerReserveUpdate {
  pickupLocationId: number;
  dropoffLocationId: number;
  hasTraveled: boolean;
}

// === New shape for booking creation (matches backend after API migration) ===

export interface LegInfo {
  pickupLocationId: number | null;
  dropoffLocationId: number | null;
  price: number;
}

export interface PassengerBooking {
  customerId: number;
  isPayment: boolean;
  hasTraveled: boolean;
  outbound: LegInfo;
  return: LegInfo | null;
}

export interface PassengerBookingExternal {
  customerId: number | null;
  isPayment: boolean;
  hasTraveled: boolean;
  firstName: string;
  lastName: string;
  email: string | null;
  phone1: string;
  documentNumber: string;
  outbound: LegInfo;
  return: LegInfo | null;
}

export interface PaymentItem {
  transactionAmount: number;
  paymentMethod: number;
}

export interface PassengerReserveCreateRequestWrapper {
  reserveTypeId: ReserveTypeId;
  outboundReserveId: number;
  returnReserveId: number | null;
  payments: PaymentItem[];
  passengers: PassengerBooking[];
  creditAmount?: number;
}

export interface ExternalPayment {
  transactionAmount: number;
  token: string;
  description: string;
  installments: number;
  paymentMethodId: string;
  payerEmail: string;
  identificationType?: string;
  identificationNumber?: string;
}

export interface CreateReserveWithLockRequest {
  lockToken: string;
  reserveTypeId: ReserveTypeId;
  outboundReserveId: number;
  returnReserveId: number | null;
  payment: ExternalPayment | null;
  passengers: PassengerBookingExternal[];
  /**
   * Email donde el backend envía el comprobante de pago al comprador. Separado
   * del `payerEmail` de MercadoPago. Obligatorio cuando se paga con wallet
   * (`payment === null`); opcional en tarjeta, pero conviene enviarlo igual.
   */
  receiptEmail?: string;
}
