---
status: accepted
---

# Lecturas client vía React Query; catálogo server vía Data Cache

## Contexto

El front es App Router. La capa de datos es server-side: [services/api.ts](../../services/api.ts)
es `'use server'` y cada llamada pasa por [`getServerAxios`](../../services/axios.ts), que resuelve
sesión NextAuth, `Bearer` rotativo (ver [ADR 0004](0004-refresh-token-rotativo-bajo-nextauth-serverless.md)),
cookies y headers de tenant.

Hasta ahora las **lecturas** desde componentes client se hacían llamando esas Server Actions
directamente (en `useEffect`/handlers), a través del hook propio
[hooks/use-api.ts](../../hooks/use-api.ts), que **no cachea ni dedupe**. Cada mount/interacción =
round-trip nuevo. Esto causó over-fetching real:

- La landing hacía un **N+1**: por cada trip público disparaba un `GetTripById` en paralelo, sólo
  para tener `stopSchedules` de una ruta que el usuario quizá ni elige.
- Como la landing renderiza dinámico (lee host/cookies), `GetPublicTrips` se golpeaba en **cada
  visita** pese al `revalidate` del page.

`@tanstack/react-query` (v5) estaba instalado pero **sin usar** y sin `QueryClientProvider`.

## Decisión

Estandarizar el data-fetching en **tres carriles**, según quién dispara la lectura:

1. **Lectura renderizada en el server (catálogo).** Server Component + **Data Cache** de Next
   (`unstable_cache` / `fetch` con `tags`), keyeado por tenant. Ejemplo: `getPublicTrips` en
   [services/trip.ts](../../services/trip.ts) — cacheado por `tenantCode` + paginación, TTL 10 min,
   tag `public-trips`. La función cacheada **no puede leer** `headers()`/`cookies()`: se resuelve el
   tenant afuera y se pasa como argumento.

2. **Lectura disparada por interacción del cliente.** **React Query sobre la Server Action
   existente** (no se reemplaza la Server Action; se la usa como `queryFn`). Así se reutiliza toda
   la auth/tenant de `getServerAxios` y se gana dedupe + cache + colapso de requests del lado
   cliente, sin un segundo carril de acceso al backend. Provider:
   [components/query-provider.tsx](../../components/query-provider.tsx) (montado en
   [app/layout.tsx](../../app/layout.tsx)). Ejemplo de hook:
   [hooks/queries/use-trip.ts](../../hooks/queries/use-trip.ts).

3. **Mutación.** Server Action (`post`/`put` en [services/api.ts](../../services/api.ts)) +
   `revalidateTag('<tag>')` cuando invalide catálogo cacheado del carril 1.

### Convenciones del carril 2

- **Query keys** vía factory tipada (`tripKeys.detail(tripId, reserveId)`), incluyendo todo
  parámetro que cambie la respuesta (ej. `reserveId`, que hace la data por-reserva).
- **`staleTime`** según naturaleza del dato:
  - Catálogo público (rutas/precios, cambian poco) → largo (`STALE_TRIP_CATALOG = 10 min`).
  - Data por-reserva / precios editables en admin → `0` (frescura: cada apertura/refetch trae lo
    último; reemplaza los `refetch` manuales).
- **Errores**: la Server Action arroja `API_ERROR:<code>`; propaga al `error` de la query y se mapea
  con [`getApiErrorMessage`](../../lib/apiErrors.ts), igual que antes.
- Default global del provider: `staleTime 60s`, `refetchOnWindowFocus false`, `retry 1`.

## Alcance / migración

Piloto aplicado al **flujo de trips**: `hero-section`, `checkout/LocationSelector`,
`admin/reserves/AddReservationFlow` migrados a `useTrip`.

[hooks/use-api.ts](../../hooks/use-api.ts) queda **legacy**: no se borra (lo usan ~40 consumidores),
pero **toda lectura client nueva usa React Query**, y se migra incrementalmente.

## Opciones consideradas (descartadas)

- **Route Handlers (GET) + React Query para toda lectura.** Más idiomático para lecturas puras
  (cacheables a nivel HTTP), pero duplica/extrae el wiring de auth+tenant a otro carril. Se reserva
  para casos que no encajan en la Server Action (binarios/SEO), como ya hace
  [ADR 0005](0005-export-binario-via-route-handler-fuera-del-carril-server-action.md).
- **Seguir con `useApi`.** Sin cache/dedupe; es justo lo que causaba el over-fetching.

## Consecuencias

- Las lecturas client repetidas (re-mount, navegar y volver) se sirven del cache de React Query
  dentro del `staleTime`, sin re-pegar al backend.
- Coexisten dos hooks de fetching client (`useApi` legacy y React Query) durante la migración; el
  estándar para lo nuevo es React Query.
- Las Server Actions de lectura siguen siendo POST serializados; React Query no las paraleliza, pero
  reduce drásticamente cuántas veces se llaman.
