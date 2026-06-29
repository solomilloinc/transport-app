import { RESERVE_TYPE, ReserveTypeId } from '@/constants/reserveType';
import type {
  CreateReserveWithLockRequest,
  ExternalPayment,
  PassengerBooking,
  PassengerBookingExternal,
  PassengerReserveCreateRequestWrapper,
  PaymentItem,
} from '@/interfaces/passengerReserve';
import {
  createReserveWithLockRequestSchema,
  passengerReserveCreateRequestSchema,
} from '@/validations/passengerReserveCreateSchema';

function legSum(passengers: Array<{ outbound: { price: number }; return: { price: number } | null }>) {
  return passengers.reduce(
    (acc, p) => acc + p.outbound.price + (p.return?.price ?? 0),
    0,
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateExpectedTotal(
  passengers: Array<{ outbound: { price: number }; return: { price: number } | null }>,
): number {
  return round2(legSum(passengers));
}

export interface BuildAdminReservePayloadArgs {
  reserveTypeId: ReserveTypeId;
  outboundReserveId: number;
  returnReserveId: number | null;
  passengers: PassengerBooking[];
  paymentMethod: number; // for the auto-generated single payment item
}

// Builds the admin POST /passenger-reserves-create body and validates against
// the server's rules 1-6 before returning. Throws ZodError if anything's off.
//
// `payments[0].transactionAmount` is auto-computed from the passenger legs to
// match the server's `totalExpectedAmount` (defends against OverPaymentNotAllowed).
// Pass `payments=[]` upstream if the caller wants no payment (PendingPayment state).
export function buildAdminReservePayload(
  args: BuildAdminReservePayloadArgs,
): PassengerReserveCreateRequestWrapper {
  const total = calculateExpectedTotal(args.passengers);
  const payments: PaymentItem[] =
    total > 0
      ? [{ transactionAmount: total, paymentMethod: args.paymentMethod }]
      : [];

  const payload: PassengerReserveCreateRequestWrapper = {
    reserveTypeId: args.reserveTypeId,
    outboundReserveId: args.outboundReserveId,
    returnReserveId:
      args.reserveTypeId === RESERVE_TYPE.ROUND_TRIP ? args.returnReserveId : null,
    payments,
    passengers: args.passengers,
  };

  return passengerReserveCreateRequestSchema.parse(payload);
}

// Same as above but lets the caller supply the exact `payments[]` (used when
// the admin UI splits the total across multiple payment methods).
export function buildAdminReservePayloadWithPayments(args: {
  reserveTypeId: ReserveTypeId;
  outboundReserveId: number;
  returnReserveId: number | null;
  passengers: PassengerBooking[];
  payments: PaymentItem[];
  creditAmount?: number;
}): PassengerReserveCreateRequestWrapper {
  const payload: PassengerReserveCreateRequestWrapper = {
    reserveTypeId: args.reserveTypeId,
    outboundReserveId: args.outboundReserveId,
    returnReserveId:
      args.reserveTypeId === RESERVE_TYPE.ROUND_TRIP ? args.returnReserveId : null,
    payments: args.payments,
    passengers: args.passengers,
    ...(args.creditAmount ? { creditAmount: args.creditAmount } : {}),
  };
  return passengerReserveCreateRequestSchema.parse(payload);
}

export interface BuildPublicReservePayloadArgs {
  lockToken: string;
  reserveTypeId: ReserveTypeId;
  outboundReserveId: number;
  returnReserveId: number | null;
  passengers: PassengerBookingExternal[];
  payment: ExternalPayment | null;
  receiptEmail?: string;
}

export function buildPublicReservePayload(
  args: BuildPublicReservePayloadArgs,
): CreateReserveWithLockRequest {
  const receiptEmail = args.receiptEmail?.trim();
  const payload: CreateReserveWithLockRequest = {
    lockToken: args.lockToken,
    reserveTypeId: args.reserveTypeId,
    outboundReserveId: args.outboundReserveId,
    returnReserveId:
      args.reserveTypeId === RESERVE_TYPE.ROUND_TRIP ? args.returnReserveId : null,
    payment: args.payment,
    passengers: args.passengers,
    ...(receiptEmail ? { receiptEmail } : {}),
  };
  return createReserveWithLockRequestSchema.parse(payload);
}
