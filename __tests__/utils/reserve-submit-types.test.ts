import { describe, it, expect } from 'vitest';
import {
  defaultReturnRequestedReserveTypeId,
  departureDateKey,
  isRoundTripDifferentDays,
  reserveTypeIdFromQuoteApplied,
} from '@/utils/reserve-submit-types';

describe('reserve-submit-types', () => {
  it('departureDateKey extracts yyyy-MM-dd', () => {
    expect(departureDateKey('2026-04-26T09:00:00')).toBe('2026-04-26');
    expect(departureDateKey(null)).toBeNull();
  });

  it('isRoundTripDifferentDays is true when calendar day differs', () => {
    expect(
      isRoundTripDifferentDays(
        { DepartureDate: '2026-04-26T09:00:00' },
        { DepartureDate: '2026-04-27T18:00:00' },
      ),
    ).toBe(true);
  });

  it('isRoundTripDifferentDays is false on same calendar day', () => {
    expect(
      isRoundTripDifferentDays(
        { DepartureDate: '2026-04-26T09:00:00' },
        { DepartureDate: '2026-04-26T18:00:00' },
      ),
    ).toBe(false);
  });

  it('defaultReturnRequestedReserveTypeId is 1 when different days', () => {
    expect(
      defaultReturnRequestedReserveTypeId(
        { DepartureDate: '2026-04-26' },
        { DepartureDate: '2026-04-27' },
      ),
    ).toBe(1);
  });

  it('defaultReturnRequestedReserveTypeId is 2 when same day', () => {
    expect(
      defaultReturnRequestedReserveTypeId(
        { DepartureDate: '2026-04-26T08:00:00' },
        { DepartureDate: '2026-04-26T20:00:00' },
      ),
    ).toBe(2);
  });

  it('reserveTypeIdFromQuoteApplied prefers applied when 1 or 2', () => {
    expect(reserveTypeIdFromQuoteApplied(2, 1)).toBe(2);
    expect(reserveTypeIdFromQuoteApplied(1, 2)).toBe(1);
  });

  it('reserveTypeIdFromQuoteApplied falls back on undefined or invalid', () => {
    expect(reserveTypeIdFromQuoteApplied(undefined, 1)).toBe(1);
    expect(reserveTypeIdFromQuoteApplied(99, 2)).toBe(2);
  });
});
