# Relevamiento — Reportería de reservas (frontend)

**Estado:** **implementado** en el branch (capa de datos + Route Handler + UI con tabs/charts/export).
Pendiente: **deploy del backend** para datos reales, y los **filtros por entidad** (ver §12). Verificado
por typecheck; falta verificación funcional end-to-end (requiere sesión Admin + backend deployado).
**Charter (contrato, fuente de verdad):** `transport-api/docs/frontend/reporteria-reservas-api.md`.
**Branch:** `ayuse/reporteria-reservas`.
**Decisiones de arquitectura:** [ADR 0005](../adr/0005-export-binario-via-route-handler-fuera-del-carril-server-action.md).
**Glosario:** ver `CONTEXT.md` → secciones *Reportería*, *Vendido vs Cobrado*, *Reserva del día*.

> Este doc es el **mapa de implementación** del front. El *qué hace cada endpoint* vive en el
> charter; acá va el *cómo lo integramos*. Si divergen, gana el charter.

---

## 1. Qué es

Dos familias de reporte **analítico sobre un rango** (≤ 92 días), cada una con 3 endpoints
(grilla / summary / export):

| Familia | Fila | Para qué |
|---|---|---|
| **Por pasajero** (`reporting/passengers`) | un Pasajero | ventas / manifiesto |
| **Por reserva** (`reporting/reserves`) | una Reserva del día | ocupación |

**No confundir** con el reporte operativo del día (`reserve-report/{date}`) ni con la búsqueda de
disponibilidad — ver `CONTEXT.md`. Por eso **nada** reutiliza los nombres `ReserveReport*` /
`PassengerReserveReport*`: todo lo nuevo vive bajo el namespace **`reporting/*`**.

---

## 2. Decisiones tomadas

| # | Decisión | Razón |
|---|---|---|
| D1 | Umbral canónico **"Reportería"**, namespace `reporting/*` | No colisionar con los 3 reportes que ya existen |
| D2 | **Una** entrada de sidebar → página con **dos tabs** (Por pasajero / Por reserva) | Son dos lentes del mismo rango; comparten ~70% (barra de filtros, rango, export) |
| D3 | **Auth Admin** en página y entrada de menú (`roles: ['admin']`) | Los 6 endpoints exponen ingresos/deuda |
| D4 | Tipos TS = **espejo exacto del wire** (inglés), traducción solo al render | Cada capa de remap fue donde aparecieron bugs pasados |
| D5 | **Export vía Route Handler** reusando `getServerAxios` (no Server Action) | Preserva `Content-Disposition`; el token vive server-side y rota — [ADR 0005](../adr/0005-export-binario-via-route-handler-fuera-del-carril-server-action.md) |
| D6 | Grilla con `useReportFilters`; **summary desacoplado** (`useReportSummary`); export imperativo | El summary es caro: se pide al cambiar filtros, no por página |
| D7 | Selector de rango **estilo Azure**, presets **por fecha** (Hoy / 3 / 7 / 30 días / Personalizado) | La API es granularidad **día** (`yyyy-MM-dd`); no hay banda horaria |
| D8 | Defaults: **Últimos 7 días**, `dateField: travel`, `statuses` **omitido** (default backend) | Pinta rápido; "qué operó"; no hardcodear el default del backend |
| D9 | Default incluye `Cancelled`; ingresos son **netos** de cancelados; `cancelledAmount` en tarjeta aparte | La baja se ve sin inflar ventas |

---

## 3. Navegación / IA

- Agregar entrada en `app/admin/layout.tsx` → `MENU_CONFIG.main`:
  `{ name: 'Reportería', icon: BarChart3, path: '/admin/reporting', roles: ['admin'] }`
  (sin submenu — los dos reportes son tabs dentro de la página).
- Página `app/admin/reporting/page.tsx`: shell con `Tabs` (shadcn) "Por pasajero" / "Por reserva".
  El tab activo puede ir en la URL (`?tab=passengers|reserves`) para deep-link.
- Al cambiar de tab se **conserva el rango de fechas** y se re-piden grilla + summary de la familia.

---

## 4. Estructura de archivos

**Crear:**

```
app/admin/reporting/
  page.tsx                          # shell de tabs (D2)
app/api/reporting/
  passengers/export/route.ts        # Route Handler binario (D5)
  reserves/export/route.ts
interfaces/filters/
  reporting-passengers-filters.ts   # ReportingPassengersFilters (+ empty)
  reporting-reserves-filters.ts     # ReportingReservesFilters (+ empty)
interfaces/
  reporting.ts                      # items + summaries + enums (espejo wire, D4)
services/
  reporting.ts                      # grilla + summary (server actions)
  reporting-export.ts               # helper cliente: fetch al route + descarga blob
hooks/
  use-report-summary.ts             # useReportSummary(applied) (D6)
components/admin/reporting/
  PassengersReportTab.tsx
  ReservesReportTab.tsx
  ReportingFilters.tsx              # filtros compartidos + slot por familia
  ReportingDateRangePicker.tsx      # presets estilo Azure (D7)
  ReportingSummaryCards.tsx         # tarjetas de totales (incl. "Cancelado", D9)
  charts/ (Pie | Bar | Line | OccupancyHistogram).tsx   # sobre components/ui/chart.tsx
  ExportButton.tsx
```

**Tocar:**
- `app/admin/layout.tsx` — entrada de menú (§3).
- `middleware.ts` — confirmar que `/admin/reporting` y `/api/reporting/*` queden cubiertos por el
  guard de auth admin existente.

**Reutilizar sin tocar:** `hooks/use-report-filters.ts`, `hooks/url-parsers.ts`,
`components/dashboard/{dashboard-table,table-pagination,page-header}`, `components/ui/chart.tsx`,
`services/{api,axios}.ts`.

---

## 5. Modelo de datos (espejo del wire — D4)

`interfaces/reporting.ts` (resumen; copiar campos **tal cual** del charter §1–§2):

```ts
// --- Por pasajero ---
interface ReportingPassengerRow {
  passengerId: number; reserveId: number; tripId: number; tripName: string;
  originName: string; destinationName: string; reserveDate: string; departureHour: string;
  fullName: string; documentNumber: string; email: string; phone: string;
  status: number; hasTraveled: boolean; isFrequent: boolean;
  customerId: number | null; price: number; paymentMethod: string | null;
  currentBalance: number | null; overdueBalance: number | null;
}
interface ReportingPassengersSummary {
  totals: { passengers: number; withCustomer: number; frequent: number; traveled: number;
            soldAmount: number; collectedAmount: number; debt: number;
            cancelled: number; cancelledAmount: number };   // cancelled* = nuevos (D9)
  byStatus:        { status: number; label: string; count: number }[];               // pie
  byPaymentMethod: { method: number; label: string; count: number; soldAmount: number }[]; // pie
  byRoute:         { tripId: number; tripName: string; count: number; soldAmount: number }[]; // bar
  byDay:           { date: string; count: number; soldAmount: number }[];            // line
}

// --- Por reserva ---
interface ReportingReserveRow {
  reserveId: number; tripId: number; tripName: string; originName: string; destinationName: string;
  reserveDate: string; departureHour: string; status: number; isHoliday: boolean;
  vehicleId: number; internalNumber: string; driverId: number;
  capacity: number; reservedCount: number; availableCount: number; occupancyPct: number;
  soldAmount: number; collectedAmount: number;
}
interface ReportingReservesSummary {
  totals: { reserves: number; passengers: number; capacity: number;
            averageOccupancyPct: number; soldAmount: number; collectedAmount: number };
  byStatus:              { status: number; label: string; count: number }[];          // pie
  byRoute:               { tripId: number; tripName: string; count: number; soldAmount: number }[]; // bar
  byDay:                 { date: string; count: number }[];                            // line
  occupancyDistribution: { range: string; count: number }[];                           // histograma
}
```

Filtros = espejo del request del charter, con header `/** Espejo de … */` como el resto de
`interfaces/filters/*`. PII (no persistir en URL): `search` lleva nombre/documento/email/teléfono →
marcar `urlSafe:false` en sus parsers.

---

## 6. Flujo de datos (D6)

Por tab, **3 llamadas con disparadores distintos**:

| Llamada | Hook / fn | Re-fetch cuando |
|---|---|---|
| Grilla | `useReportFilters` (sin cambios) | filtros + página + orden |
| Summary | `useReportSummary(applied)` (nuevo) | **solo** filtros (memo `JSON.stringify(applied)`) |
| Export | `exportReporting(family, applied, sort)` | imperativo (click) |

`services/reporting.ts` (server actions):
- `getReportingPassengers(params)` → `get('/reporting/passengers', pagedRequest)` *(el helper `get`
  ya hace POST para reportes, ver `services/api.ts`)*.
- `getReportingPassengersSummary(filters)` → `postWithResponse('/reporting/passengers/summary', body)`
  *(el summary no es paginado; `postWithResponse` devuelve el objeto entero)*.
- Ídem `…Reserves`.

---

## 7. Filtros, rango y defaults

**Compartidos** (ambas familias): rango (`dateFrom`/`dateTo`), `dateField`, `statuses`, `tripId`,
`vehicleId`, `driverId`, `search`.
**Por pasajero** suma: `customerId`, `hasTraveled`, `onlyFrequent`, `paymentMethod`.
**Por reserva** suma: `isHoliday`, `source`, `onlyWithAvailability`, `onlyWithPassengers`,
`minOccupancyPct`, `maxOccupancyPct`.

**Selector de rango (D7):** radios `Hoy / Últimos 3 / 7 / 30 días / Personalizado` + Aplicar/Cancelar.
Presets = ventanas rodantes (hoy−N…hoy). "Personalizado" = dos `<input type="date">`.

**Defaults al abrir (D8):** **Últimos 7 días**, `dateField: travel`, `statuses` **omitido**.
El filtro de estados muestra rótulo "Por defecto" + tooltip listando qué estados implica; al abrir
el multiselect se pre-marcan y recién ahí viajan explícitos (no hardcodear la lista en el payload).

**Estados por default del backend** (referencia):
- Pasajero `[1,2,3,4]` = PendingPayment, Confirmed, **Cancelled**, Traveled (todos).
- Reserva `[1,2,3]` = Confirmed, Cancelled, Completed (excluye Available/Rejected/Expired).

---

## 8. Gráficos (sobre `components/ui/chart.tsx` / recharts)

El backend da los números; el front elige el tipo (indicado al lado de cada bucket en el charter):

| Familia | Bucket | Gráfico |
|---|---|---|
| Pasajero | `byStatus` | pie |
| Pasajero | `byPaymentMethod` | pie |
| Pasajero | `byRoute` | bar |
| Pasajero | `byDay` | line |
| Reserva | `byStatus` | pie |
| Reserva | `byRoute` | bar |
| Reserva | `byDay` | line |
| Reserva | `occupancyDistribution` | histograma (bar, rangos fijos) |

Etiquetas en los gráficos = `label` del bucket (ya viene en español).

---

## 9. Export xlsx (D5 / ADR 0005)

- `POST /api/reporting/{passengers,reserves}/export` (Route Handler) → reusa `getServerAxios`,
  pega al backend con `responseType: 'arraybuffer'`, **passthrough** de `Content-Type` +
  `Content-Disposition`.
- Cliente (`reporting-export.ts`): `fetch` → `blob()` → `URL.createObjectURL` → click `<a download>`.
  Body = `{ filters, sortBy, sortDescending }` (sin `pageNumber`/`pageSize`).
- Errores 422/400 (ventana > 92 días, > ~50k filas): el route reenvía status + `API_ERROR:<code>`;
  el cliente muestra el mensaje **verbatim**.

---

## 10. Errores

- **92 días:** validar en cliente *antes* de pegar (feedback inmediato) **y** mostrar el 422 verbatim
  si igual llega (backend = autoridad). Mensaje "achicá el rango" tal cual.
- **Sesión:** `useReportFilters` ya hace `signOut` ante `SessionExpiredError`; reusar ese camino en
  `useReportSummary` y en el export.

---

## 11. Gotchas conocidos

- **`DashboardTable` + casing del accessor:** el wire es camelCase; los `accessor` deben matchear el
  casing **o** usar `cell` (un accessor PascalCase deja la columna en blanco). Preferir `cell`
  renderers para precio/fechas/estado.
- **Status numérico, no string:** acá `status` viene como **código numérico** (no "Activo"/"Active");
  filtrar/mapear por número, traducir a label al render.
- **Server Action error masking:** no aplica al export (va por Route Handler), pero sí a grilla/summary:
  los errores del backend ya vuelven como `API_ERROR:<code>` desde `services/api.ts`.

---

## 12. Dependencias y orden sugerido

1. **Bloqueante:** deploy del backend (hoy no deployado). Hasta entonces, todo contra el contrato.
2. Interfaces + servicios + Route Handler (capa sin UI, testeable).
3. Shell de tabs + filtros compartidos + selector de rango.
4. Tab "Por pasajero" (grilla + summary + cards + charts + export).
5. Tab "Por reserva" (reusa lo anterior; suma histograma de ocupación).
6. Entrada de sidebar + guard de auth admin.

### Estado de implementación (v1)

**Hecho:** interfaces (espejo wire), filtros, `services/reporting.ts`, Route Handlers de export +
`services/reporting-export.ts`, `useReportSummary`, selector de rango Azure, multiselect de estados,
tarjetas de totales (incl. "Cancelado"), 4 gráficos por familia, ambas grillas con paginación y
export, página con tabs, entrada de sidebar (Admin) y guard de `middleware.ts` (`/admin/reporting` +
`/api/reporting` → solo Admin).

- **Sub-pestañas Resumen / Detalle** dentro de cada familia (filtros compartidos arriba), para no
  scrollear todo junto. Default: Resumen.
- **Orden server-side por header de columna**, respetando el **whitelist** del charter §0.5
  (`DashboardTable` extendido con `sortKey` + `onSort`; sólo se habilitan las columnas ordenables:
  pasajeros `reservedate`/`route`/`lastname`/`price`/`status`; reservas
  `reservedate`/`route`/`occupancy`/`status`). Cambiar el orden resetea a página 1.

**Filtros por entidad — implementados reusando `ApiSelect`:** `tripId` / `vehicleId` / `driverId`
ahora se eligen con selects (componente `EntitySelect` sobre el `ApiSelect` existente, alimentado por
`useReportingEntityOptions` → `getTripsForSelect` / `getVehicleReport` / `getDriverReport`). El
filtro `customerId` **no** lleva select propio a propósito: el campo de **búsqueda libre** ya matchea
nombre/documento/email/teléfono del cliente (charter §1.1).

**Diferido a una próxima iteración (decisión de scope, no bloqueante):**
- **Deep-link del tab** (`?tab=`): el tab activo (familia y Resumen/Detalle) vive en estado local; el
  rango sí se conserva al cambiar de familia (va en la URL).
- **Columnas calculadas no ordenables** (charter §0.5): pasajeros `paymentMethod`/`overdueBalance`/
  `currentBalance`; reservas `soldAmount`/`collectedAmount`/`occupancyPct`. Si se necesitan, el
  backend evalúa moverlas al query.

**Verificación pendiente (bloqueada por entorno):** prueba funcional end-to-end con sesión Admin y
backend deployado. El typecheck pasa para todos los archivos nuevos.
