# Cobranza (Pagos + Caja) — implementación frontend

**Estado:** **implementado** en branch `ayuse/reporteria-reservas`. Typecheck OK; falta verificación
end-to-end (requiere sesión Admin/Operator + backend deployado).
**Charter (contrato):** `transport-api/docs/frontend/cobranza-pagos-caja-api.md`.
**Glosario:** `CONTEXT.md` → *Cobranza — Pagos y Caja*.

## Decisión central: sección aparte, no tabs de Reportería

Lo **fuerza la auth**: Reservas es **Admin-only** (gateada así en `middleware.ts`); Cobranza es
**Admin + Operator**, y `operator` mapea a `user` ([lib/auth-role.ts](../../lib/auth-role.ts)). Si
fuera un tab de la página de Reservas, los Operadores no entrarían. Por eso es **ruta aparte**
(`/admin/cashbox`, gateada a `admin/superadmin/user`).

En el **sidebar** sí se agrupan: el ítem "Reportería" es un submenu con dos sub-items — "Reservas"
(`/admin/reporting`, roles `['admin']`) y "Cobranza" (`/admin/cashbox`, roles `['admin','user']`).
El submenu filtra por rol, así que un Operador ve el grupo con sólo "Cobranza". El padre **despliega**
(no navega), por eso no necesita una página propia.

## Reuso (casi todo)

Misma infra que la Reportería: `useReportFilters`, `useReportSummary`, `DashboardTable` (con sort),
`TablePagination`, `ReportingDateRangePicker`, `StatusFilterMulti`, `ExportButton`, los charts
(`GenericPieChart`/`GenericBarChart` nuevos, aditivos) y el **Route Handler de export**
(`handleReportingExport`, ya genérico). El `ExportButton` y `exportReport` se **generalizaron** para
tomar `endpoint` en vez de `family` (sirve a Reportería y Cobranza).

## Archivos nuevos

```
app/admin/cashbox/page.tsx                       # tabs Pagos | Caja + drill-down
app/api/cashbox/{payments,report}/export/route.ts
interfaces/cobranza.ts                            # PaymentRow, summaries, métodos/estados
interfaces/filters/cashbox-payments-filters.ts
services/cobranza.ts
components/admin/cobranza/PaymentsReportTab.tsx
components/admin/cobranza/CashBoxesReportTab.tsx
components/admin/cobranza/CobranzaSummaryCards.tsx
```
**Tocados:** `interfaces/filters/cashbox-filters.ts` (+`openedByUserId`/`closedByUserId`),
`middleware.ts` (gate), `app/admin/layout.tsx` (sidebar "Cobranza"), `services/reporting-export.ts`
+ `ExportButton.tsx` (generalizados a `endpoint`). La fila de Caja reusa `interfaces/cash-box.ts`.

## Gotchas del contrato respetados (espejo, sin normalizar)

- **Pagos** usa `dateFrom`/`dateTo`; **Caja** usa `fromDate`/`toDate` + `status` **string**
  `"Open"`/`"Closed"`. Distintos a propósito.
- `byMethod` tiene **shape distinto**: Pagos `{key,label,count,amount}`; Caja
  `{paymentMethodId,paymentMethodName,amount}`.
- **No hay QR**: entra como Online (2). Etiquetado "Online (incl. QR)".
- **Drill-down** Caja → Pagos por `cashBoxId` (botón "Ver pagos"; chip removible en Pagos).
- Pagos default **cronológico** (`date` asc).

## Diferido (no bloqueante)

- Filtros `openedByUserId`/`closedByUserId` de Caja: están en el tipo/payload pero sin UI (necesitan
  select de usuarios).
- Caja no tiene tope de 92 días, pero el date-picker compartido lo aplica en modo "Personalizado"
  (límite cosmético, no del backend). Si molesta, se parametriza el picker.
