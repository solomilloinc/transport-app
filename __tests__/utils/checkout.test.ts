import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildReservePayloadItems,
  clearCheckoutDraftFromStorage,
  clearCheckoutFromStorage,
  getEffectiveTripPrice,
  loadCheckoutDraftFromStorage,
  loadCheckoutFromStorage,
  saveCheckoutDraftToStorage,
  saveCheckoutToStorage,
  validatePassengerData,
} from '@/utils/checkout';
import type { ReserveSummaryItem } from '@/interfaces/reserve';

const makeTrip = (overrides: Partial<ReserveSummaryItem> = {}): ReserveSummaryItem => ({
  ReserveId: 10,
  TripId: 100,
  OriginName: 'Cordoba',
  DestinationName: 'Buenos Aires',
  DepartureHour: '08:00',
  DepartureDate: '2026-03-20',
  Price: 15000,
  AvailableQuantity: 10,
  VehicleName: 'Bus 1',
  EstimatedDuration: '08:00',
  ArrivalHour: '16:00',
  StopSchedules: [],
  ...overrides,
});

describe('checkout utils', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('validates required passenger data', () => {
    expect(validatePassengerData([], 1)).toBeTruthy();

    expect(validatePassengerData([
      {
        firstName: 'Juan',
        lastName: 'Perez',
        phone: '1234',
        documentNumber: '12345678',
        email: 'invalid-email',
      },
    ], 1)).toContain('email');
  });

  it('builds payload items for one way and round trip', () => {
    const oneWay = buildReservePayloadItems({
      passengers: [
        {
          firstName: 'Juan',
          lastName: 'Perez',
          phone: '1234',
          documentNumber: '12345678',
          email: 'juan@test.com',
        },
      ],
      outboundTrip: makeTrip(),
      outboundLocation: {
        pickupDirectionId: 1,
        dropoffCityId: 2,
        dropoffCityName: 'Rosario',
        dropoffDirectionId: 3,
        dropoffPrice: 12000,
      },
      returnLocation: {
        pickupDirectionId: null,
        dropoffCityId: null,
        dropoffCityName: null,
        dropoffDirectionId: null,
        dropoffPrice: 0,
      },
      outboundPrice: 12000,
      returnPrice: 0,
    });

    expect(oneWay).toHaveLength(1);
    expect(oneWay[0].reserveTypeId).toBe(1);
    expect(oneWay[0].price).toBe(12000);

    const roundTrip = buildReservePayloadItems({
      passengers: [
        {
          firstName: 'Juan',
          lastName: 'Perez',
          phone: '1234',
          documentNumber: '12345678',
          email: 'juan@test.com',
        },
      ],
      outboundTrip: makeTrip({ ReserveId: 10 }),
      returnTrip: makeTrip({ ReserveId: 11, TripId: 101 }),
      outboundLocation: {
        pickupDirectionId: 1,
        dropoffCityId: 2,
        dropoffCityName: 'Rosario',
        dropoffDirectionId: 3,
        dropoffPrice: 12000,
      },
      returnLocation: {
        pickupDirectionId: 4,
        dropoffCityId: 5,
        dropoffCityName: 'Cordoba',
        dropoffDirectionId: 6,
        dropoffPrice: 13000,
      },
      outboundPrice: 12000,
      returnPrice: 13000,
    });

    expect(roundTrip).toHaveLength(2);
    expect(roundTrip[0].reserveTypeId).toBe(2);
    expect(roundTrip[1].reserveTypeId).toBe(2);
  });

  it('persists checkout state and ignores expired locks', () => {
    saveCheckoutToStorage({
      outboundTrip: makeTrip(),
      returnTrip: null,
      passengers: 2,
      lockState: {
        lockToken: 'abc',
        expiresAt: new Date(Date.now() - 60000).toISOString(),
        timeoutMinutes: 10,
      },
    });

    const loaded = loadCheckoutFromStorage();
    expect(loaded?.outboundTrip?.ReserveId).toBe(10);
    expect(loaded?.lockState).toBeNull();

    clearCheckoutFromStorage();
    expect(loadCheckoutFromStorage()).toBeNull();
  });

  it('persists checkout draft separately', () => {
    saveCheckoutDraftToStorage({
      outboundReserveId: 10,
      returnReserveId: null,
      currentStep: 'review',
      passengerData: [
        {
          firstName: 'Juan',
          lastName: 'Perez',
          phone: '1234',
          documentNumber: '12345678',
          email: 'juan@test.com',
        },
      ],
      paymentMethod: 'wallet',
      outboundLocation: {
        pickupDirectionId: 1,
        dropoffCityId: 2,
        dropoffCityName: 'Rosario',
        dropoffDirectionId: 3,
        dropoffPrice: 12000,
      },
      returnLocation: {
        pickupDirectionId: null,
        dropoffCityId: null,
        dropoffCityName: null,
        dropoffDirectionId: null,
        dropoffPrice: 0,
      },
    });

    expect(loadCheckoutDraftFromStorage()?.currentStep).toBe('review');

    clearCheckoutDraftFromStorage();
    expect(loadCheckoutDraftFromStorage()).toBeNull();
  });

  it('uses selected dropoff price when present', () => {
    expect(getEffectiveTripPrice(100, 50)).toBe(100);
    expect(getEffectiveTripPrice(0, 50)).toBe(50);
  });
});
