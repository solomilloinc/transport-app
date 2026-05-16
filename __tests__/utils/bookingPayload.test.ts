import { describe, expect, it } from 'vitest';
import {
  buildAdminReservePayload,
  buildPublicReservePayload,
  calculateExpectedTotal,
} from '@/utils/bookingPayload';
import { RESERVE_TYPE } from '@/constants/reserveType';
import type {
  PassengerBooking,
  PassengerBookingExternal,
} from '@/interfaces/passengerReserve';

function adminPax(overrides: Partial<PassengerBooking> = {}): PassengerBooking {
  return {
    customerId: 1,
    isPayment: true,
    hasTraveled: false,
    outbound: { pickupLocationId: 1, dropoffLocationId: 2, price: 100 },
    return: null,
    ...overrides,
  };
}

function externalPax(
  overrides: Partial<PassengerBookingExternal> = {},
): PassengerBookingExternal {
  return {
    customerId: null,
    isPayment: true,
    hasTraveled: false,
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@example.com',
    phone1: '+541112345678',
    documentNumber: '30123456',
    outbound: { pickupLocationId: 1, dropoffLocationId: 2, price: 100 },
    return: null,
    ...overrides,
  };
}

describe('calculateExpectedTotal', () => {
  it('sums outbound + return per passenger', () => {
    expect(
      calculateExpectedTotal([
        { outbound: { price: 80 }, return: { price: 80 } },
        { outbound: { price: 80 }, return: { price: 80 } },
      ]),
    ).toBe(320);
  });

  it('handles passengers without return leg', () => {
    expect(
      calculateExpectedTotal([
        { outbound: { price: 100 }, return: null },
        { outbound: { price: 100 }, return: null },
      ]),
    ).toBe(200);
  });
});

describe('buildAdminReservePayload', () => {
  it('builds an Ida payload with null returnReserveId', () => {
    const out = buildAdminReservePayload({
      reserveTypeId: RESERVE_TYPE.IDA,
      outboundReserveId: 1,
      returnReserveId: null,
      passengers: [adminPax()],
      paymentMethod: 1,
    });

    expect(out.reserveTypeId).toBe(RESERVE_TYPE.IDA);
    expect(out.returnReserveId).toBeNull();
    expect(out.passengers[0].return).toBeNull();
    expect(out.payments).toEqual([{ transactionAmount: 100, paymentMethod: 1 }]);
  });

  it('builds an IdaVuelta same-day payload, total = 2 * discounted price', () => {
    const out = buildAdminReservePayload({
      reserveTypeId: RESERVE_TYPE.ROUND_TRIP,
      outboundReserveId: 1,
      returnReserveId: 2,
      passengers: [
        adminPax({
          outbound: { pickupLocationId: 1, dropoffLocationId: 2, price: 80 },
          return: { pickupLocationId: 2, dropoffLocationId: 1, price: 80 },
        }),
      ],
      paymentMethod: 1,
    });

    expect(out.returnReserveId).toBe(2);
    expect(out.payments[0].transactionAmount).toBe(160);
  });

  it('builds an IdaVuelta multi-day payload, total = 2 * Ida price', () => {
    const out = buildAdminReservePayload({
      reserveTypeId: RESERVE_TYPE.ROUND_TRIP,
      outboundReserveId: 1,
      returnReserveId: 2,
      passengers: [
        adminPax({
          outbound: { pickupLocationId: 1, dropoffLocationId: 2, price: 100 },
          return: { pickupLocationId: 2, dropoffLocationId: 1, price: 100 },
        }),
      ],
      paymentMethod: 1,
    });

    expect(out.payments[0].transactionAmount).toBe(200);
  });

  it('IdaVuelta with 3 passengers totals 3x both legs', () => {
    const pax = adminPax({
      outbound: { pickupLocationId: 1, dropoffLocationId: 2, price: 80 },
      return: { pickupLocationId: 2, dropoffLocationId: 1, price: 80 },
    });
    const out = buildAdminReservePayload({
      reserveTypeId: RESERVE_TYPE.ROUND_TRIP,
      outboundReserveId: 1,
      returnReserveId: 2,
      passengers: [pax, pax, pax],
      paymentMethod: 1,
    });

    expect(out.payments[0].transactionAmount).toBe(480);
  });

  it('rejects round-trip without returnReserveId', () => {
    expect(() =>
      buildAdminReservePayload({
        reserveTypeId: RESERVE_TYPE.ROUND_TRIP,
        outboundReserveId: 1,
        returnReserveId: null,
        passengers: [
          adminPax({
            return: { pickupLocationId: 2, dropoffLocationId: 1, price: 80 },
          }),
        ],
        paymentMethod: 1,
      }),
    ).toThrow();
  });

  it('rejects Ida with a return leg in a passenger', () => {
    expect(() =>
      buildAdminReservePayload({
        reserveTypeId: RESERVE_TYPE.IDA,
        outboundReserveId: 1,
        returnReserveId: null,
        passengers: [
          adminPax({
            return: { pickupLocationId: 2, dropoffLocationId: 1, price: 80 },
          }),
        ],
        paymentMethod: 1,
      }),
    ).toThrow();
  });

  it('rejects empty passengers array', () => {
    expect(() =>
      buildAdminReservePayload({
        reserveTypeId: RESERVE_TYPE.IDA,
        outboundReserveId: 1,
        returnReserveId: null,
        passengers: [],
        paymentMethod: 1,
      }),
    ).toThrow();
  });

  it('rejects outboundReserveId === returnReserveId', () => {
    expect(() =>
      buildAdminReservePayload({
        reserveTypeId: RESERVE_TYPE.ROUND_TRIP,
        outboundReserveId: 5,
        returnReserveId: 5,
        passengers: [
          adminPax({
            return: { pickupLocationId: 2, dropoffLocationId: 1, price: 80 },
          }),
        ],
        paymentMethod: 1,
      }),
    ).toThrow();
  });
});

describe('buildPublicReservePayload', () => {
  it('builds a public Ida payload with lockToken', () => {
    const out = buildPublicReservePayload({
      lockToken: 'abc',
      reserveTypeId: RESERVE_TYPE.IDA,
      outboundReserveId: 1,
      returnReserveId: null,
      passengers: [externalPax()],
      payment: null,
    });

    expect(out.lockToken).toBe('abc');
    expect(out.passengers[0].firstName).toBe('Juan');
    expect(out.passengers[0].return).toBeNull();
  });

  it('builds a public IdaVuelta payload with N passengers', () => {
    const pax = externalPax({
      outbound: { pickupLocationId: 1, dropoffLocationId: 2, price: 80 },
      return: { pickupLocationId: 2, dropoffLocationId: 1, price: 80 },
    });
    const out = buildPublicReservePayload({
      lockToken: 'tok',
      reserveTypeId: RESERVE_TYPE.ROUND_TRIP,
      outboundReserveId: 1,
      returnReserveId: 2,
      passengers: [pax, pax],
      payment: null,
    });

    expect(out.passengers).toHaveLength(2);
    expect(out.passengers[0].return?.price).toBe(80);
  });
});
