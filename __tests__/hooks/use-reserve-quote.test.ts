import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const getReserveQuoteMock = vi.fn();

vi.mock('@/services/quote', () => ({
  getReserveQuote: (...args: unknown[]) => getReserveQuoteMock(...args),
}));

import { useReserveQuote } from '@/hooks/use-reserve-quote';
import type {
  ReserveQuoteRequestDto,
  ReserveQuoteResponseDto,
} from '@/interfaces/quote';

const sampleRequest: ReserveQuoteRequestDto = {
  items: [
    {
      tripId: 10,
      reserveDate: '2026-04-20T08:00:00',
      reserveTypeId: 1,
      dropoffDirectionId: 5,
      passengerCount: 1,
    },
  ],
};

const makeResponse = (overrides?: Partial<ReserveQuoteResponseDto>): ReserveQuoteResponseDto => ({
  items: [
    {
      tripId: 10,
      requestedReserveTypeId: 1,
      appliedReserveTypeId: 1,
      unitPrice: 1000,
      subtotal: 1000,
    },
  ],
  total: 1000,
  discountsLost: [],
  ...overrides,
});

describe('useReserveQuote', () => {
  beforeEach(() => {
    getReserveQuoteMock.mockReset();
  });

  it('populates data on successful quote', async () => {
    const response = makeResponse();
    getReserveQuoteMock.mockResolvedValueOnce(response);

    const { result } = renderHook(() => useReserveQuote());

    await act(async () => {
      await result.current.quote(sampleRequest);
    });

    expect(result.current.data).toEqual(response);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('exposes discountsLost when backend returns them', async () => {
    const response = makeResponse({
      discountsLost: [
        { code: 'RoundTripSameDayOnly', message: 'Combo aplica sólo mismo día.' },
      ],
    });
    getReserveQuoteMock.mockResolvedValueOnce(response);

    const { result } = renderHook(() => useReserveQuote());

    await act(async () => {
      await result.current.quote(sampleRequest);
    });

    expect(result.current.data?.discountsLost).toHaveLength(1);
    expect(result.current.data?.discountsLost[0].code).toBe('RoundTripSameDayOnly');
  });

  it('exposes degraded item when applied !== requested', async () => {
    const response = makeResponse({
      items: [
        {
          tripId: 20,
          requestedReserveTypeId: 2,
          appliedReserveTypeId: 1,
          unitPrice: 1500,
          subtotal: 1500,
          reason: 1,
          reasonCode: 'RoundTripDifferentDay',
        },
      ],
      total: 1500,
    });
    getReserveQuoteMock.mockResolvedValueOnce(response);

    const { result } = renderHook(() => useReserveQuote());

    await act(async () => {
      await result.current.quote(sampleRequest);
    });

    expect(result.current.data?.items[0].requestedReserveTypeId).toBe(2);
    expect(result.current.data?.items[0].appliedReserveTypeId).toBe(1);
    expect(result.current.data?.items[0].reasonCode).toBe('RoundTripDifferentDay');
  });

  it('sets error when the service rejects', async () => {
    const err = new Error('boom');
    getReserveQuoteMock.mockRejectedValueOnce(err);

    const { result } = renderHook(() => useReserveQuote());

    await act(async () => {
      await expect(result.current.quote(sampleRequest)).rejects.toBe(err);
    });

    expect(result.current.error).toBe(err);
    expect(result.current.loading).toBe(false);
  });

  it('ignores stale responses when a newer request resolves first', async () => {
    const slow = makeResponse({ total: 111 });
    const fast = makeResponse({ total: 222 });

    let resolveSlow: (v: ReserveQuoteResponseDto) => void = () => {};
    const slowPromise = new Promise<ReserveQuoteResponseDto>((r) => { resolveSlow = r; });
    getReserveQuoteMock.mockReturnValueOnce(slowPromise);
    getReserveQuoteMock.mockResolvedValueOnce(fast);

    const { result } = renderHook(() => useReserveQuote());

    let slowCall: Promise<unknown> | undefined;
    act(() => {
      slowCall = result.current.quote(sampleRequest);
    });

    await act(async () => {
      await result.current.quote(sampleRequest);
    });

    expect(result.current.data?.total).toBe(222);

    await act(async () => {
      resolveSlow(slow);
      await slowCall;
    });

    expect(result.current.data?.total).toBe(222);
  });

  it('requote re-fires the last request', async () => {
    const first = makeResponse({ total: 100 });
    const second = makeResponse({ total: 200 });
    getReserveQuoteMock.mockResolvedValueOnce(first);
    getReserveQuoteMock.mockResolvedValueOnce(second);

    const { result } = renderHook(() => useReserveQuote());

    await act(async () => {
      await result.current.quote(sampleRequest);
    });
    expect(result.current.data?.total).toBe(100);

    await act(async () => {
      await result.current.requote();
    });
    expect(result.current.data?.total).toBe(200);
    expect(getReserveQuoteMock).toHaveBeenCalledTimes(2);
    expect(getReserveQuoteMock.mock.calls[1][0]).toEqual(sampleRequest);
  });

  it('reset clears data and error', async () => {
    const response = makeResponse();
    getReserveQuoteMock.mockResolvedValueOnce(response);

    const { result } = renderHook(() => useReserveQuote());

    await act(async () => {
      await result.current.quote(sampleRequest);
    });
    expect(result.current.data).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
