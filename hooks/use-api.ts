
import { PagedResponse, UseApiCall } from "@/services/types";
import { useCallback, useEffect, useState } from "react";

type UseApiOptions<P> = {
  autoFetch?: boolean;
  params?: P
}

type CustomError = Error | null;

interface UseApiResult<T, P, R = PagedResponse<T>> {
  loading: boolean;
  data: R;
  error: CustomError;
  fetch: (param: P) => void;
  reset: () => void;
}

export const useApi = <T, P, R = PagedResponse<T>>(apiCall: (param: P) => UseApiCall<T, R>, options?: UseApiOptions<P>): UseApiResult<T, P, R> => {
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<R>({} as R)
  const [error, setError] = useState<CustomError>(null)

  const reset = () => setData({} as R);

  const fetch = useCallback((param: P) => {
    const { call } = apiCall(param);
    setLoading(true);

    call.then((response) => {
      setData(response);
      setError(null);
    }).catch((err) => {
      setError(err)
    }).finally(() => {
      setLoading(false)
    })
  }, [apiCall])

  useEffect(() => {
    if (options?.autoFetch) {
      fetch(options.params || {} as P);
    }
  }, [fetch, options?.autoFetch, options?.params])

  return { loading, data, reset, error, fetch }
}