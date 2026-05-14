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
  1: 'Pendiente de pago',
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
  paidAmount: number;
}

export interface PassengerReserveReport extends PassengerReserve {
  fullName: string;
  documentNumber: string;
  pickupLocationName: string;
  dropoffLocationName: string;
  currentBalance: number;
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
}
