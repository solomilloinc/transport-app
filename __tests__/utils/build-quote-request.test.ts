import { describe, it, expect } from 'vitest';
import { buildQuoteRequest } from '@/utils/build-quote-request';
import { ReserveSummaryItem } from '@/interfaces/reserve';
import { LocationSelectionData } from '@/components/checkout/LocationSelector';

const outboundTrip: ReserveSummaryItem = {
  ReserveId: 100,
  TripId: 10,
  OriginName: 'A',
  DestinationName: 'B',
  DepartureHour: '08:00',
  DepartureDate: '2026-04-20T08:00:00',
  Price: 1000,
  AvailableQuantity: 10,
  VehicleName: 'Bus 1',
  EstimatedDuration: '2h',
  ArrivalHour: '10:00',
  StopSchedules: null,
};

const returnTrip: ReserveSummaryItem = {
  ReserveId: 200,
  TripId: 20,
  OriginName: 'B',
  DestinationName: 'A',
  DepartureHour: '18:00',
  DepartureDate: '2026-04-20T18:00:00',
  Price: 1000,
  AvailableQuantity: 10,
  VehicleName: 'Bus 2',
  EstimatedDuration: '2h',
  ArrivalHour: '20:00',
  StopSchedules: null,
};

const validLocation: LocationSelectionData = {
  pickupDirectionId: 1,
  dropoffCityId: 7,
  dropoffCityName: 'B',
  dropoffTripPriceId: 99,
  dropoffDirectionId: 9,
  dropoffPrice: 1000,
};

const missingDropoff: LocationSelectionData = {
  pickupDirectionId: 1,
  dropoffCityId: null,
  dropoffCityName: null,
  dropoffTripPriceId: null,
  dropoffDirectionId: null,
  dropoffPrice: 0,
};

const cityOnlyLocation: LocationSelectionData = {
  pickupDirectionId: 1,
  dropoffCityId: 7,
  dropoffCityName: 'B',
  dropoffTripPriceId: null,
  dropoffDirectionId: null,
  dropoffPrice: 1000,
};

describe('buildQuoteRequest', () => {
  it('returns null when outboundTrip is missing', () => {
    expect(
      buildQuoteRequest({
        outboundTrip: null,
        passengers: 1,
        outboundLocation: validLocation,
      }),
    ).toBeNull();
  });

  it('returns null when outbound dropoff is missing entirely', () => {
    expect(
      buildQuoteRequest({
        outboundTrip,
        passengers: 1,
        outboundLocation: missingDropoff,
      }),
    ).toBeNull();
  });

  it('allows outbound quote when only dropoffCityId is present (no specific direction)', () => {
    const req = buildQuoteRequest({
      outboundTrip,
      passengers: 1,
      outboundLocation: cityOnlyLocation,
    });
    expect(req).not.toBeNull();
    expect(req!.items[0].dropoffCityId).toBe(7);
    expect(req!.items[0].dropoffDirectionId).toBeUndefined();
    expect(req!.items[0].dropoffLocationId).toBe(7);
  });

  it('returns null when returnTrip is set but return dropoff is missing', () => {
    expect(
      buildQuoteRequest({
        outboundTrip,
        returnTrip,
        passengers: 1,
        outboundLocation: validLocation,
        returnLocation: missingDropoff,
      }),
    ).toBeNull();
  });

  it('returns 1 item with reserveTypeId 1 when only outbound is present', () => {
    const req = buildQuoteRequest({
      outboundTrip,
      passengers: 2,
      outboundLocation: validLocation,
    });

    expect(req).not.toBeNull();
    expect(req!.items).toHaveLength(1);
    expect(req!.items[0]).toEqual({
      tripId: 10,
      reserveDate: '2026-04-20T08:00:00',
      reserveTypeId: 1,
      dropoffLocationId: 9,
      dropoffDirectionId: 9,
      dropoffCityId: 7,
      passengerCount: 2,
    });
  });

  it('returns 2 items paired by tripId when outbound+return both valid', () => {
    const req = buildQuoteRequest({
      outboundTrip,
      returnTrip,
      passengers: 3,
      outboundLocation: validLocation,
      returnLocation: validLocation,
    });

    expect(req).not.toBeNull();
    expect(req!.items).toHaveLength(2);
    expect(req!.items[0].tripId).toBe(10);
    expect(req!.items[0].reserveTypeId).toBe(1);
    expect(req!.items[0].dropoffLocationId).toBe(9);
    expect(req!.items[1].tripId).toBe(20);
    expect(req!.items[1].reserveTypeId).toBe(2);
    expect(req!.items[1].dropoffLocationId).toBe(9);
    expect(req!.items.every((i) => i.passengerCount === 3)).toBe(true);
  });

  it('always requests Ida+IdaVuelta (1+2) on quote even when return is another day (resolver adjusts applied)', () => {
    const returnOtherDay: ReserveSummaryItem = {
      ...returnTrip,
      DepartureDate: '2026-04-21T18:00:00',
    };
    const req = buildQuoteRequest({
      outboundTrip,
      returnTrip: returnOtherDay,
      passengers: 2,
      outboundLocation: validLocation,
      returnLocation: validLocation,
    });
    expect(req).not.toBeNull();
    expect(req!.items[0].reserveTypeId).toBe(1);
    expect(req!.items[1].reserveTypeId).toBe(2);
  });
});
