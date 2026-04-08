'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { PagedResponse, PaginationParams, UseApiCall } from '@/services/types';
import { pruneEmpty, UrlParser } from './url-parsers';

/**
 * Claves reservadas de URL para paginación/orden. Colisionan con el namespace
 * de filtros: si un filtro se llama `page`, hay que renombrarlo.
 */
const PAGE_KEY = 'page';
const PAGE_SIZE_KEY = 'pageSize';
const SORT_BY_KEY = 'sortBy';
const SORT_DESC_KEY = 'sortDesc';

type Parsers<T> = { [K in keyof T]: UrlParser<T[K] extends infer U | undefined ? U : T[K]> };

/**
 * El service puede ser un server action (`Promise<PagedResponse>`) o el patrón
 * clásico `UseApiCall<T>` con `{ call }`. El hook soporta ambos.
 */
export type ReportApiCall<TItem> = (
  params: PaginationParams
) => Promise<PagedResponse<TItem>> | UseApiCall<TItem>;

export interface UseReportFiltersOptions<TFilter extends object, TItem> {
  /** Shape por defecto del filtro (todos los campos, vacíos). */
  defaults: TFilter;
  /** Parsers por campo. Los que tengan urlSafe:false NO se persisten en URL. */
  parsers: Parsers<TFilter>;
  /** Service que recibe el `PaginationParams` tipado. */
  apiCall: ReportApiCall<TItem>;
  /** Valores iniciales de paginación. */
  initialPageSize?: number;
  initialSortBy?: string;
  initialSortDescending?: boolean;
  /** Si es true, dispara fetch al montar. Default: true. */
  autoFetch?: boolean;
}

export interface UseReportFiltersResult<TFilter, TItem> {
  // Draft: edición en curso, no dispara fetch
  draft: TFilter;
  setDraftField: <K extends keyof TFilter>(key: K, value: TFilter[K]) => void;
  setDraft: (next: TFilter) => void;

  // Applied: lo efectivamente aplicado (url-safe desde URL, PII desde memoria)
  applied: TFilter;

  // Acciones
  apply: () => void;
  reset: () => void;
  refetch: () => Promise<void>;

  // Paginación
  pageNumber: number;
  setPageNumber: (n: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  sortBy: string | undefined;
  setSortBy: (s: string | undefined) => void;
  sortDescending: boolean;
  setSortDescending: (b: boolean) => void;

  // Data
  data: PagedResponse<TItem>;
  loading: boolean;
  error: Error | null;
}

function isSessionExpiredError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('SessionExpiredError') ||
    message.includes('Sesión expirada') ||
    message.includes('No autorizado')
  );
}

/**
 * Hook genérico de reportería con paginación, orden y filtros.
 *
 * - Estado de filtros url-safe sincronizado con `useSearchParams`.
 * - Filtros PII (urlSafe:false) quedan solo en memoria.
 * - Aplicación manual via `apply()`; paginación/orden aplican directo.
 * - Campos vacíos se omiten del payload y de la URL.
 */
export function useReportFilters<TFilter extends object, TItem>(
  options: UseReportFiltersOptions<TFilter, TItem>
): UseReportFiltersResult<TFilter, TItem> {
  const {
    defaults,
    parsers,
    apiCall,
    initialPageSize = 10,
    initialSortBy,
    initialSortDescending = true,
    autoFetch = true,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ----- Parse inicial desde URL -----
  const parseFromUrl = useCallback(
    (sp: URLSearchParams): TFilter => {
      const out: any = { ...defaults };
      (Object.keys(parsers) as (keyof TFilter)[]).forEach((key) => {
        const parser = parsers[key];
        if (!parser.urlSafe) return; // PII: no se hidrata desde URL
        const raw = sp.get(String(key));
        const parsed = parser.parse(raw);
        if (parsed !== undefined) {
          out[key] = parsed;
        }
      });
      return out as TFilter;
    },
    [defaults, parsers]
  );

  // ----- Applied filter -----
  // Parte url-safe: derivada de URL cada render.
  const urlSafeApplied = useMemo(
    () => parseFromUrl(new URLSearchParams(searchParams.toString())),
    [parseFromUrl, searchParams]
  );

  // Parte PII: vive en memoria, se copia desde draft al hacer apply().
  const [piiApplied, setPiiApplied] = useState<Partial<TFilter>>({});

  const applied = useMemo<TFilter>(
    () => ({ ...urlSafeApplied, ...piiApplied } as TFilter),
    [urlSafeApplied, piiApplied]
  );

  // ----- Draft -----
  const [draft, setDraftState] = useState<TFilter>(() => ({ ...defaults, ...urlSafeApplied }));

  const setDraftField = useCallback(
    <K extends keyof TFilter>(key: K, value: TFilter[K]) => {
      setDraftState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );
  const setDraft = useCallback((next: TFilter) => setDraftState(next), []);

  // ----- Paginación (desde URL) -----
  const pageNumber = useMemo(() => {
    const raw = searchParams.get(PAGE_KEY);
    const n = raw ? Number(raw) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const raw = searchParams.get(PAGE_SIZE_KEY);
    const n = raw ? Number(raw) : initialPageSize;
    return Number.isFinite(n) && n > 0 ? n : initialPageSize;
  }, [searchParams, initialPageSize]);

  const sortBy = useMemo(() => {
    return searchParams.get(SORT_BY_KEY) ?? initialSortBy;
  }, [searchParams, initialSortBy]);

  const sortDescending = useMemo(() => {
    const raw = searchParams.get(SORT_DESC_KEY);
    if (raw == null) return initialSortDescending;
    return raw === 'true' || raw === '1';
  }, [searchParams, initialSortDescending]);

  // ----- URL writer -----
  const writeUrl = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      mutate(sp);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // ----- Pagination setters -----
  const setPageNumber = useCallback(
    (n: number) => {
      writeUrl((sp) => {
        if (n <= 1) sp.delete(PAGE_KEY);
        else sp.set(PAGE_KEY, String(n));
      });
    },
    [writeUrl]
  );

  const setPageSize = useCallback(
    (n: number) => {
      writeUrl((sp) => {
        sp.set(PAGE_SIZE_KEY, String(n));
        sp.delete(PAGE_KEY); // reset a página 1
      });
    },
    [writeUrl]
  );

  const setSortBy = useCallback(
    (s: string | undefined) => {
      writeUrl((sp) => {
        if (!s) sp.delete(SORT_BY_KEY);
        else sp.set(SORT_BY_KEY, s);
      });
    },
    [writeUrl]
  );

  const setSortDescending = useCallback(
    (b: boolean) => {
      writeUrl((sp) => {
        sp.set(SORT_DESC_KEY, String(b));
      });
    },
    [writeUrl]
  );

  // ----- Apply / Reset -----
  const apply = useCallback(() => {
    // Partición draft → url-safe vs PII
    const nextPii: Partial<TFilter> = {};

    writeUrl((sp) => {
      // Reset a página 1 al aplicar filtros
      sp.delete(PAGE_KEY);

      (Object.keys(parsers) as (keyof TFilter)[]).forEach((key) => {
        const parser = parsers[key];
        const value = draft[key];
        if (!parser.urlSafe) {
          nextPii[key] = value;
          return;
        }
        const serialized = parser.serialize(value as any);
        if (serialized == null) {
          sp.delete(String(key));
        } else {
          sp.set(String(key), serialized);
        }
      });
    });

    setPiiApplied(nextPii);
  }, [draft, parsers, writeUrl]);

  const reset = useCallback(() => {
    setDraftState(defaults);
    setPiiApplied({});
    writeUrl((sp) => {
      (Object.keys(parsers) as (keyof TFilter)[]).forEach((key) => {
        sp.delete(String(key));
      });
      sp.delete(PAGE_KEY);
    });
  }, [defaults, parsers, writeUrl]);

  // ----- Fetch -----
  const [data, setData] = useState<PagedResponse<TItem>>({} as PagedResponse<TItem>);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const appliedRef = useRef(applied);
  appliedRef.current = applied;

  const doFetch = useCallback(async () => {
    const filtersPayload = pruneEmpty(applied as object) as Record<string, any>;
    const params: PaginationParams = {
      pageNumber,
      pageSize,
      sortBy,
      sortDescending,
      filters: filtersPayload,
    };

    setLoading(true);
    try {
      const result = apiCall(params);
      const response = await (typeof (result as any)?.then === 'function'
        ? (result as Promise<PagedResponse<TItem>>)
        : (result as UseApiCall<TItem>).call);
      setData(response as PagedResponse<TItem>);
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
  }, [apiCall, applied, pageNumber, pageSize, sortBy, sortDescending]);

  // Auto-fetch cuando cambian los parámetros resueltos (URL o PII)
  useEffect(() => {
    if (!autoFetch) return;
    doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoFetch,
    // serializamos applied para evitar re-fetches por referencias nuevas
    JSON.stringify(applied),
    pageNumber,
    pageSize,
    sortBy,
    sortDescending,
  ]);

  const refetch = useCallback(async () => {
    await doFetch();
  }, [doFetch]);

  return {
    draft,
    setDraftField,
    setDraft,
    applied,
    apply,
    reset,
    refetch,
    pageNumber,
    setPageNumber,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortDescending,
    setSortDescending,
    data,
    loading,
    error,
  };
}
