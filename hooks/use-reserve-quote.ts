'use client';

import { useCallback, useRef, useState } from 'react';
import { getReserveQuote } from '@/services/quote';
import {
  ReserveQuoteRequestDto,
  ReserveQuoteResponseDto,
  ReserveQuoteItemResponse,
  ReserveQuoteDiscountLost,
} from '@/interfaces/quote';

interface UseReserveQuoteResult {
  loading: boolean;
  data: ReserveQuoteResponseDto | null;
  error: unknown;
  quote: (req: ReserveQuoteRequestDto) => Promise<ReserveQuoteResponseDto | null>;
  requote: () => Promise<ReserveQuoteResponseDto | null>;
  reset: () => void;
}

// Backend serializes responses in PascalCase while the rest of the app uses
// camelCase internally. Normalize both shapes so consumers (and tests) stay
// on camelCase regardless of what the server returns.
function pick<T>(source: any, ...keys: string[]): T | undefined {
  if (!source) return undefined;
  for (const k of keys) {
    if (source[k] !== undefined) return source[k];
  }
  return undefined;
}

function normalizeItem(raw: any): ReserveQuoteItemResponse {
  return {
    tripId: pick<number>(raw, 'tripId', 'TripId') ?? 0,
    requestedReserveTypeId: pick<number>(raw, 'requestedReserveTypeId', 'RequestedReserveTypeId') ?? 0,
    appliedReserveTypeId: pick<number>(raw, 'appliedReserveTypeId', 'AppliedReserveTypeId') ?? 0,
    unitPrice: pick<number>(raw, 'unitPrice', 'UnitPrice') ?? 0,
    subtotal: pick<number>(raw, 'subtotal', 'Subtotal') ?? 0,
    reason: pick<number>(raw, 'reason', 'Reason') ?? undefined,
    reasonCode: pick<string>(raw, 'reasonCode', 'ReasonCode') ?? undefined,
  };
}

function normalizeDiscount(raw: any): ReserveQuoteDiscountLost {
  return {
    code: pick<string>(raw, 'code', 'Code') ?? '',
    message: pick<string>(raw, 'message', 'Message') ?? '',
  };
}

function normalizeResponse(raw: any): ReserveQuoteResponseDto {
  const itemsRaw = pick<any[]>(raw, 'items', 'Items');
  const discountsRaw = pick<any[]>(raw, 'discountsLost', 'DiscountsLost');
  return {
    items: Array.isArray(itemsRaw) ? itemsRaw.map(normalizeItem) : [],
    total: pick<number>(raw, 'total', 'Total') ?? 0,
    discountsLost: Array.isArray(discountsRaw) ? discountsRaw.map(normalizeDiscount) : [],
  };
}

export function useReserveQuote(): UseReserveQuoteResult {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReserveQuoteResponseDto | null>(null);
  const [error, setError] = useState<unknown>(null);

  const requestIdRef = useRef(0);
  const lastRequestRef = useRef<ReserveQuoteRequestDto | null>(null);

  const quote = useCallback(
    async (req: ReserveQuoteRequestDto): Promise<ReserveQuoteResponseDto | null> => {
      const currentId = ++requestIdRef.current;
      lastRequestRef.current = req;
      setLoading(true);

      try {
        const response = await getReserveQuote(req);
        if (currentId !== requestIdRef.current) {
          return null;
        }
        const safeResponse = normalizeResponse(response);
        setData(safeResponse);
        setError(null);
        return safeResponse;
      } catch (err) {
        if (currentId !== requestIdRef.current) {
          return null;
        }
        setError(err);
        throw err;
      } finally {
        if (currentId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const requote = useCallback(async (): Promise<ReserveQuoteResponseDto | null> => {
    if (!lastRequestRef.current) return null;
    return quote(lastRequestRef.current);
  }, [quote]);

  const reset = useCallback(() => {
    requestIdRef.current++;
    lastRequestRef.current = null;
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, data, error, quote, requote, reset };
}
