import { describe, it, expect, vi, beforeEach } from 'vitest';

const postWithResponseMock = vi.fn();

vi.mock('@/services/api', () => ({
  postWithResponse: (...args: unknown[]) => postWithResponseMock(...args),
}));

import { getReserveQuote } from '@/services/quote';
import type {
  ReserveQuoteRequestDto,
  ReserveQuoteResponseDto,
} from '@/interfaces/quote';

describe('getReserveQuote', () => {
  beforeEach(() => {
    postWithResponseMock.mockReset();
  });

  const sampleRequest: ReserveQuoteRequestDto = {
    items: [
      {
        tripId: 10,
        reserveDate: '2026-04-20T08:00:00',
        reserveTypeId: 1,
        dropoffDirectionId: 5,
        dropoffCityId: 3,
        passengerCount: 2,
      },
    ],
  };

  const sampleResponse: ReserveQuoteResponseDto = {
    items: [
      {
        tripId: 10,
        requestedReserveTypeId: 1,
        appliedReserveTypeId: 1,
        unitPrice: 1000,
        subtotal: 2000,
      },
    ],
    total: 2000,
    discountsLost: [],
  };

  it('calls postWithResponse with /reserves/quote, the payload and skipAuth:true', async () => {
    postWithResponseMock.mockResolvedValueOnce(sampleResponse);

    const result = await getReserveQuote(sampleRequest);

    expect(postWithResponseMock).toHaveBeenCalledTimes(1);
    expect(postWithResponseMock).toHaveBeenCalledWith(
      '/reserves/quote',
      sampleRequest,
      { skipAuth: true },
    );
    expect(result).toEqual(sampleResponse);
  });

  it('propagates errors from postWithResponse', async () => {
    const err = new Error('API_ERROR:QuoteFailed');
    postWithResponseMock.mockRejectedValueOnce(err);

    await expect(getReserveQuote(sampleRequest)).rejects.toBe(err);
  });
});
