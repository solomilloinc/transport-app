import { PagedResponse, UseApiCall } from "@/services/types";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";

type UseApiOptions<P> = {
  autoFetch?: boolean;
  params?: P
}

type CustomError = Error | null;

interface UseApiResult<T, P, R = PagedResponse<T>> {
  loading: boolean;
  data: R;
  error: CustomError;
  fetch: (param: P) => Promise<R>;
  reset: () => void;
}

/**
 * Detecta si un error es de sesión expirada
 */
function isSessionExpiredError(error: unknown): boolean {
  if (!error) return false;

  const message = error instanceof Error
    ? error.message
    : String(error);

  return message.includes('SessionExpiredError') ||
    message.includes('Sesión expirada') ||
    message.includes('No autorizado');
}

/**
 * Maneja errores de sesión expirada redirigiendo al login
 */
function handleSessionExpired() {
  console.warn('Sesión expirada - redirigiendo al login');
  signOut({ callbackUrl: '/', redirect: true });
}

export const useApi = <T, P, R = PagedResponse<T>>(apiCall: (param: P) => UseApiCall<T, R>, options?: UseApiOptions<P>): UseApiResult<T, P, R> => {
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<R>({} as R)
  const [error, setError] = useState<CustomError>(null)

  const reset = () => setData({} as R);

  const fetch = useCallback((param: P) => {
    const { call } = apiCall(param);
    setLoading(true);

    return call.then((response) => {
      setData(response);
      setError(null);
      return response;
    }).catch((err) => {
      // Detectar error de sesión expirada y redirigir al login
      if (isSessionExpiredError(err)) {
        handleSessionExpired();
        throw err;
      }
      setError(err)
      throw err;
    }).finally(() => {
      setLoading(false)
    })
  }, [apiCall]);

  useEffect(() => {
    if (options?.autoFetch) {
      fetch(options.params || {} as P);
    }
  }, [fetch, options?.autoFetch, options?.params])

  return { loading, data, reset, error, fetch }
}