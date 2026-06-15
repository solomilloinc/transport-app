'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { pruneEmpty } from './url-parsers';

function isSessionExpiredError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('SessionExpiredError') ||
    message.includes('Sesión expirada') ||
    message.includes('No autorizado')
  );
}

export interface UseReportSummaryResult<TSummary> {
  data: TSummary | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Companion de `useReportFilters` para las agregaciones de la Reportería.
 *
 * A diferencia de la grilla, el summary se calcula sobre **todo el set filtrado**
 * (es caro) y por eso vuelve a pedirse **solo cuando cambian los filtros** —
 * nunca por paginación ni orden (charter §4). Se memoiza sobre
 * `JSON.stringify(pruneEmpty(applied))`, igual que el doFetch de la grilla.
 *
 * `pruneEmpty` quita los campos vacíos: en particular `statuses` undefined se
 * omite, dejando que el backend aplique su default.
 */
export function useReportSummary<TFilter extends object, TSummary>(
  applied: TFilter,
  fetcher: (filters: TFilter) => Promise<TSummary>,
  options?: { autoFetch?: boolean }
): UseReportSummaryResult<TSummary> {
  const { autoFetch = true } = options ?? {};

  const [data, setData] = useState<TSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const appliedRef = useRef(applied);
  appliedRef.current = applied;

  const appliedKey = JSON.stringify(pruneEmpty(applied as object));

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const filters = pruneEmpty(appliedRef.current as object) as TFilter;
      const result = await fetcherRef.current(filters);
      setData(result);
      setError(null);
    } catch (err) {
      if (isSessionExpiredError(err)) {
        signOut({ callbackUrl: '/', redirect: true });
        throw err;
      }
      setError(err as Error);
    } finally {
      setLoading(false);
    }
    // appliedKey en deps: re-fetch sólo cuando cambian los filtros aplicados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKey]);

  useEffect(() => {
    if (!autoFetch) return;
    doFetch();
  }, [autoFetch, doFetch]);

  const refetch = useCallback(async () => {
    await doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch };
}
