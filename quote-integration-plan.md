# Integración del endpoint `POST /reserves/quote` en transport-app (frontend)

## Context

El backend incorporó la regla "precio combo IdaVuelta sólo si los dos legs son el mismo día calendario" y expuso un nuevo endpoint público `POST /reserves/quote` como **única fuente de verdad del precio**. Hoy el frontend calcula precios localmente en `app/checkout/page.tsx:80-88` usando `DropoffOptionsIdaVuelta.Price` (precio combo ya aplicado), lo que ignora la nueva regla y puede mostrar un total distinto al que cobra el backend.

Esta tarea:
1. Agrega un nuevo servicio + hook de quote anónimo.
2. Reemplaza el cálculo local de precios por los valores del quote.
3. Agrega UX para comunicar cuándo se perdió el descuento combo (`discountsLost`) y cuándo el backend degradó `reserveTypeId` (`applied !== requested`).
4. Unifica el flujo de dropoff: Ida y Vuelta eligen por separado, usando `DropoffOptionsIda` en ambos trips.

**Fuera de scope (decidido con el usuario):**
- **NO** se agrega panel/toggle SuperAdmin para `roundTripSameDayOnly` en este repo (no existe rol SuperAdmin ni CRUD de tenants acá; si se necesita, va en un frontend aparte).
- **NO** se agrega sistema i18n (el repo no lo tiene); copys nuevos en español inline.

## Decisiones de diseño (resueltas con el usuario)

| Decisión | Elegido |
|---|---|
| Toggle admin `roundTripSameDayOnly` | **Omitido en este repo** |
| Dropoff en IdaVuelta | **Ida y Vuelta separados**, cada uno con `DropoffOptionsIda` de su trip |
| Estructura `DropoffOptionsIdaVuelta` | **Dejar de usarla** en el frontend (ignorar su `Price`) |
| Cuándo llamar al quote | **On-mount del checkout + inmediatamente antes del submit**, sin TTL (siempre re-quote pre-submit) |
| Si falta `dropoffLocationId` | **No llamar al quote**; placeholder "Seleccioná un destino" |
| Flujo Ida sola | **Llamar quote igual** (1 item) — eliminar todo cálculo local |
| Errores del quote | **Bloquear flujo + toast + botón "Reintentar"**, no fallback a precio local |
| `price` en payload de `passenger-reserves-create-with-lock` | **`unitPrice` del quote final pre-submit** |
| `discountsLost` UX | **Banner no-cerrable arriba del resumen + badge en item degradado** |
| State del quote | **Nuevo `useReserveQuote`** encima del `useApi` existente |

## Archivos a crear

### 1. `interfaces/quote.ts`
DTOs del quote (PascalCase en interfaces existentes; para request/response del nuevo endpoint se usa camelCase porque el payload del backend nuevo es camelCase — confirmar con swagger/OpenAPI cuando esté disponible).

```ts
export interface ReserveQuoteItemRequest {
  tripId: number;
  reserveDate: string;        // ISO date/datetime
  reserveTypeId: 1 | 2;       // 1=Ida, 2=IdaVuelta
  dropoffLocationId?: number;
  passengerCount: number;
}

export interface ReserveQuoteRequestDto {
  items: ReserveQuoteItemRequest[]; // 1 o 2; si 2, exactamente Ida+IdaVuelta
}

export interface ReserveQuoteItemResponse {
  tripId: number;
  requestedReserveTypeId: number;
  appliedReserveTypeId: number;
  unitPrice: number;
  subtotal: number;
  reason?: 1;                 // 1 = RoundTripDifferentDay
}

export interface ReserveQuoteDiscountLost {
  code: string;               // p.ej. "RoundTripSameDayOnly"
  message: string;            // mensaje en español listo para mostrar
}

export interface ReserveQuoteResponseDto {
  items: ReserveQuoteItemResponse[];
  total: number;
  discountsLost: ReserveQuoteDiscountLost[];
}
```

### 2. `services/quote.ts`
Servicio anónimo siguiendo patrón de `services/trip.ts:getPublicTrips` (usa `skipAuth: true`). Reutiliza `postWithResponse` de `services/api.ts`.

```ts
import { postWithResponse } from './api';
import { ReserveQuoteRequestDto, ReserveQuoteResponseDto } from '@/interfaces/quote';

export async function getReserveQuote(
  request: ReserveQuoteRequestDto
): Promise<ReserveQuoteResponseDto> {
  return await postWithResponse<ReserveQuoteRequestDto, ReserveQuoteResponseDto>(
    '/reserves/quote',
    request,
    { skipAuth: true }
  );
}
```

### 3. `hooks/use-reserve-quote.ts`
Wrapper sobre el hook existente `hooks/use-api.ts`. Expone `{ loading, data, error, quote(req) }` y una función `requote()` que re-usa el último request.

```ts
// Shape:
// export function useReserveQuote(): {
//   loading: boolean;
//   data: ReserveQuoteResponseDto | null;
//   error: unknown;
//   quote: (req: ReserveQuoteRequestDto) => Promise<ReserveQuoteResponseDto>;
//   requote: () => Promise<ReserveQuoteResponseDto>;
//   reset: () => void;
// }
```

Mantiene internamente el último request para permitir `requote()` pre-submit sin duplicar lógica de construcción del payload.

### 4. `utils/build-quote-request.ts`
Helper puro que construye `ReserveQuoteRequestDto` desde `CheckoutState` + dropoffs seleccionados. Testeable sin React. Encapsula el invariant:
- Si sólo hay outboundTrip → 1 item con `reserveTypeId: 1`.
- Si hay outboundTrip + returnTrip → 2 items: outbound con `reserveTypeId: 1`, return con `reserveTypeId: 2`.
- Devuelve `null` si falta algún `dropoffLocationId` requerido (señal para no llamar al quote).

### 5. `components/checkout/QuoteWarningBanner.tsx`
Banner no-cerrable de warning. Recibe `discountsLost: ReserveQuoteDiscountLost[]`. Renderiza un ítem por cada entrada con `message`. Usa el componente `Alert` de shadcn existente (variante warning) — verificar que existe en `components/ui/`; si no, usar un `div` con clases tailwind amarillas.

### 6. `components/checkout/QuoteSummary.tsx` (opcional, puede quedar inline)
Desglose por item: trip origen-destino + `unitPrice × passengers = subtotal`. Badge `Sin descuento combo` al lado del item cuando `appliedReserveTypeId !== requestedReserveTypeId`. Total final al pie.

### 7. Tests
- `__tests__/services/quote.test.ts` — mock del axios wrapper, verificar URL, payload, y `skipAuth:true`.
- `__tests__/hooks/use-reserve-quote.test.ts` — loading/data/error, caso con `discountsLost` no vacío, caso de degradación (`applied !== requested`).
- `__tests__/utils/build-quote-request.test.ts` — builder puro: sólo Ida → 1 item; IdaVuelta → 2 items pareados; falta dropoff → `null`.

## Archivos a modificar

### `app/checkout/page.tsx`
- **Eliminar cálculo local** en `:80-88` (`outboundPrice + returnPrice) * passengers`).
- Integrar `useReserveQuote` + `buildQuoteRequest`.
- `useEffect` que llama `quote()` on-mount y on-change de: dropoff outbound, dropoff return, `passengers`, fechas de los trips.
- En el step "Revisar", leer `total`, `items`, `discountsLost` del hook; mostrar loader mientras `loading`; si hay `error`, bloquear "Continuar" con toast + botón retry.
- Antes del submit (`handleCardSubmit` y `createWalletPayload`): llamar `requote()` y usar `response.items[i].unitPrice` como `price` de cada pasajero en el payload a `/passenger-reserves-create-with-lock`.
- Renderizar `<QuoteWarningBanner />` arriba del resumen si `discountsLost.length > 0`.

### `components/checkout/LocationSelector.tsx` + `components/results/ResultsClient.tsx`
Cuando `reserveTypeId === 2`:
- Outbound: usar `trip.DropoffOptionsIda` (igual que hoy para Ida sola).
- Return: usar `returnTrip.DropoffOptionsIda` (no `DropoffOptionsIdaVuelta`).
- Eliminar referencias a `DropoffOptionsIdaVuelta` en el render. El tipo sigue existiendo en `interfaces/trip.ts:56-90` pero deja de consumirse desde el checkout (se puede dejar el campo por compatibilidad con el backend).

## Verification

### Local
1. `BACKEND_URL=http://localhost:7215/api` en `.env.local` apuntando al backend con el nuevo endpoint.
2. `pnpm install && pnpm dev`.
3. Buscar un trip IdaVuelta con ida y vuelta el **mismo día** → el quote debe devolver `applied === requested = 2` y `discountsLost === []`. Verificar que el total coincide con `outbound.subtotal + return.subtotal`.
4. Buscar un trip IdaVuelta con vuelta en **otro día** → el quote debe devolver `applied = 1` en el item de vuelta, `reason: 1`, y `discountsLost` con el mensaje "El precio combo ida y vuelta aplica sólo el mismo día." — verificar banner + badge.
5. Cambiar el `passengerCount` y el dropoff → el quote se refetchea (ver Network) y el total se actualiza.
6. Dejar el checkout abierto 1 minuto y pagar → verificar segundo call al quote justo antes del submit.
7. Simular fallo del quote (desconectar backend) → "Continuar" deshabilitado + toast + botón retry funcional.
8. Flujo de sólo Ida → el quote va con 1 item y aplica igual.

### Tests
```bash
pnpm test --run __tests__/services/quote.test.ts
pnpm test --run __tests__/hooks/use-reserve-quote.test.ts
pnpm test --run __tests__/utils/build-quote-request.test.ts
```

### Tipado
```bash
pnpm tsc --noEmit
```

## Críticas referencias del código existente

| Elemento | Path |
|---|---|
| Cálculo de precio actual a eliminar | `app/checkout/page.tsx:80-88` |
| Payload submit (donde inyectar `unitPrice`) | `app/checkout/page.tsx:96-139` (wallet) y `:252-288` (card) |
| Patrón de service anónimo | `services/trip.ts` (getPublicTrips con `skipAuth:true`) |
| Hook base que reutilizamos | `hooks/use-api.ts` |
| Tipo `ReserveSummaryItem` (tiene `TripId` que necesitamos) | `interfaces/reserve.ts:54-67` |
| Context del checkout | `contexts/CheckoutContext.tsx:12-76` |
| LocationSelector con pickup/dropoff | `components/checkout/LocationSelector.tsx:34-250` |
| Trip/DropoffCityOption | `interfaces/trip.ts:56-90` |
| Toast existente (para errores del quote) | `hooks/use-toast.ts` |

## Tip operativo (fuera de scope de código)

Para generar tipos TS desde el OpenAPI del backend en vez de copiarlos a mano:
1. Levantar backend local: `cd transport.api && func start`.
2. Bajar `http://localhost:7071/api/swagger.json`.
3. Correr `openapi-typescript` / `orval` / `nswag` apuntando a ese archivo.

Esto evita drift entre los DTOs del backend y las interfaces del frontend a medida que el endpoint evoluciona.
