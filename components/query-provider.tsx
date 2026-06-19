'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Provider de React Query para lecturas disparadas por interacción del cliente
 * (carril 2 del estándar de data-fetching — ver docs/adr/0006).
 *
 * El `QueryClient` se crea con `useState(() => ...)` para que haya UNA instancia
 * por árbol de React en el cliente y NO se comparta entre requests en el server
 * (patrón recomendado por Next/React Query para App Router).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Catálogo/datos que cambian poco: evitamos refetch agresivo. Cada
            // query puede sobreescribir `staleTime` según su naturaleza.
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
