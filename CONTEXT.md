# Glosario del proyecto (Transport App — Frontend)

Términos canónicos del dominio. Alineados con el backend (`transport-api`). Cuando un término del
código difiera de este glosario, el código está mal o todavía no migró.

> **Nota**: en este repo el tipo TS de Cliente todavía se llama `Passenger`
> (`interfaces/passengers.ts`) por motivos legacy. La ruta y carpeta ya están
> alineadas (`app/admin/customers/`). Renombrar el tipo TS queda para una PR
> dedicada porque toca varias pantallas (reserves, debts, etc.).

---

## Entidades

### Cliente — `Customer`
Persona registrada. Tiene cuenta corriente (`CurrentBalance`) que se debita/acredita vía
`CustomerAccountTransaction`. Antes el frontend lo llamaba "Pasajero" (legacy).

Dos lecturas distintas del saldo, que no hay que confundir:
- **Saldo de cuenta corriente — `currentBalance`**: saldo total histórico. Incluye cargos de
  viajes **futuros** ya debitados (p. ej. los que generó una [[#suscripción--pasajero-frecuente--frequentsubscription]]).
- **Deuda vencida — `overdueBalance`**: saldo **solo por viajes ya realizados** (Reserves ya
  **partidas**, ver más abajo). Es lo cobrable sin riesgo. `null` ⇒ el Pasajero no tiene Cliente
  registrado; `0` ⇒ Cliente sin deuda vencida.

### Pasajero — `Passenger`
Instancia de reserva de un Cliente en una Reserve concreta. **Es la unidad de cobro** (ver ADR
backend 0002). Tiene snapshot de precio (ver ADR backend 0001) y, si fue auto-creado a partir de
una suscripción, un `frequentSubscriptionId` que lo liga a su origen para cascade de cancel.

#### Dar de baja un Pasajero: `Cancelar` vs `Eliminar` (NO son sinónimos)
Conviven **dos** operaciones de baja por fila, con audiencia y semántica distintas:

- **Cancelar — `Cancelar` (`passenger-cancel`)**: la baja **canónica y auditable**. Pasa el
  Passenger a estado **Cancelled** y revierte la deuda vía `CustomerAccountTransaction`
  (→ **saldo a favor** si había pagado, deuda a cero si no). **No toca la caja** (la plata ya entró).
  Si es IdaVuelta, **cancela las dos piernas** juntas. El operador **no elige** el destino de la plata:
  el backend lo decide. Es la opción por defecto que el operador debería usar.
- **Eliminar — `Eliminar` (`customer-reserve-delete`)**: baja **manual/destructiva** legacy donde el
  operador **elige** el destino del dinero (`favor` / `debt` / borrar-sin-rastro). Existe sólo para los
  casos que `Cancelar` no cubre: borrar el registro sin dejar rastro, o forzar `registrar como deuda`
  en un impago. No marca estado Cancelled ni cascada IdaVuelta.

> Regla de desambiguación para la UI: **`Cancelar` es la baja normal**; **`Eliminar` es el bisturí**.
> El solapamiento peligroso es `Eliminar → favor` ≈ `Cancelar`. **Resuelto:** en la grilla `Cancelar`
> va inline (acción visible, camino feliz) y `Eliminar` se relega al menú kebab `⋮` (acción avanzada/
> destructiva, fuera del camino feliz). La jerarquía visual es la que enseña la diferencia.

#### "Cancelar" es un término sobrecargado — siempre calificarlo
Hay **tres** "Cancelar" en el dominio, a distinto nivel. Nunca decir "cancelar" a secas:
- **Cancelar Pasajero** (`passenger-cancel`) — un Passenger (o el par IdaVuelta).
- **Cancelar Viaje/Reserva** (`reserve-update` con `status=Cancelled`) — una Reserve entera del día.
- **Cancelar Suscripción** (`FrequentSubscription`) — cascada de todos los Passengers futuros.

### Servicio — `Service`
Slot semanal único por tenant identificado por `(TripId, DayOfWeek, DepartureHour)` (ver ADR backend
0003). Tiene:
- `allowedDirections[]` — whitelist de Direcciones válidas para pickup/dropoff.
- `vehicle` — Vehículo asignado, define `capacity`.
- `status` — Active/Inactive.

### Ruta — `Trip`
Ruta comercial origen→destino. En la UI se llama **"Ruta"** (pantalla "Rutas Comerciales"); tiene
`description`. Un Servicio pertenece a una Ruta. Id = `tripId` — **nunca** "travelId". Varias
Reserves de una misma Ruta pueden coexistir en un día (distintas horas de salida).
_Evitar_: Travel, Viaje (este último está sobrecargado, ver Reserva).

### Reserva del día — `Reserve`
Un Servicio materializado en una fecha concreta; es la **fila** del reporte de reservas del día.
Identificada por `reserveId`, referencia su Ruta (`tripId`) y su salida (`reserveDate` +
`departureHour`).
> ⚠️ **Overload**: en el panel de reservas la lista de Reserves está rotulada "Viajes" (legacy). El
> Select de filtro de arriba es por **Ruta** (`Trip`), no por Reserve. Una Ruta puede tener varias
> Reserves en el día, así que filtrar por Ruta puede dejar varias filas.

> **Estado y disponibilidad** (`ReserveStatus`): las Reserves futuras las crea el batch como
> **`Confirmed` con 0 pasajeros** (`reservedCount: 0`, `availableCount: capacity`) — **eso** es la
> disponibilidad. El estado `Available` (0) es **legacy**: hoy no lo crea nada. Por eso un rango
> futuro en la [[#reportería--análisis-sobre-un-rango]] **no** viene vacío por el filtro de estado;
> si viene vacío es porque el batch todavía no generó esas fechas. Para "dónde hay lugar" se usa el
> filtro `onlyWithAvailability`, **no** el estado `Available`.

### Partida / "ya salió" — `hasDeparted`
Una Reserve está **partida** cuando su datetime de salida ya pasó: `reserveDate + departureHour <
ahora` (el corte usa **UTC**). Definición única compartida por los dos reportes: pinta de amarillo
la fila del reporte del día (`hasDeparted`) y acota la deuda vencida (`overdueBalance`).

### Dirección — `Direction`
Punto físico de pickup o dropoff (`Terminal A`, `Retiro`, etc.). El Servicio define qué Direcciones
están habilitadas; usar una fuera de `allowedDirections` retorna
`FrequentSubscription.DirectionNotAllowedForService`.

### Suscripción / Pasajero Frecuente — `FrequentSubscription`
Compromiso recurrente de un Cliente en 1 o 2 Servicios:
- **ReserveType = 1 (Ida)**: un único Servicio Ida + pickup/dropoff Ida.
- **ReserveType = 2 (IdaVuelta)**: Servicio Ida + Servicio Vuelta + 2 pares pickup/dropoff.

Tiene vigencia (`startDate`, `endDate?`). Mientras esté activa, el batch diario
`GenerateFutureReservesFunction` auto-crea Passengers `Confirmed` cada vez que se generan Reserves
del Servicio correspondiente, debitando el precio snapshot a la cuenta corriente del Cliente.

Cancelar una FrequentSubscription es atómico: cancela todos los Passengers futuros no viajados y
acredita los reembolsos en la cuenta corriente.

### Vehículo — `Vehicle`
Tiene `capacity` (cantidad de asientos). Cap duro sobre `FrequentSubscription` — no se permiten más
suscripciones activas que `capacity` en un mismo Servicio. Errores relacionados:
`Service.HasActiveSubscriptions`, `Service.VehicleCapacityBelowSubscriptions`,
`FrequentSubscription.CapacityExceeded`.

---

## Tipos de reserva — `ReserveType`

| Id | Nombre        | Significado                                          |
|----|---------------|------------------------------------------------------|
| 1  | Ida           | Un único viaje. Solo Servicio + pickup/dropoff Ida.  |
| 2  | IdaVuelta     | Ida + Vuelta. Requiere los 4 fields de pickup/dropoff. |

---

## Reportes — familias y desambiguación

"Reporte" está **sobrecargado**: conviven varios, a distinto propósito. Nunca decir "el reporte" a
secas.

### Reportería — análisis sobre un rango
Familia **nueva** de reportes **analíticos** sobre un **rango** de fechas (máx **92 días**), con
filtros ricos, paginación, agregaciones para gráficos y export a Excel. Auth `Admin` (expone
ingresos y deuda). Vive en código bajo el namespace `reporting/*` (espejo de las rutas del backend).
Tiene **dos familias**, cada una con grilla + summary + export:

- **Por pasajero** (ventas / manifiesto): la fila es un [[#pasajero--passenger]].
- **Por reserva** (ocupación): la fila es una [[#reserva-del-día--reserve]].

Se elige la **dimensión de fecha** sobre la que corre el reporte:
- **por viaje** (`dateField: travel`) — cuándo **opera** la reserva.
- **por venta** (`dateField: sale`) — cuándo se **cargó** al sistema.

> ⚠️ No confundir con los reportes que ya existían (no reusar sus nombres):
> - **Reporte del día / operativo** (`reserve-report/{date}`): una sola fecha, operativo. La
>   [[#reserva-del-día--reserve]] es su fila. Filtros viejos: `ReserveReportFilters`.
> - **Búsqueda de disponibilidad** para alta de reservas (filtros `tripId`/`passengers`/fecha).
> - **Reporte por pasajero-reserva** (`passenger-reserve-report/{id}`): detalle de un Pasajero.
>   Filtros viejos: `PassengerReserveReportFilters`.

### Vendido vs Cobrado (ingresos de Reportería)
Dos métricas distintas que **no** hay que mezclar (en el wire, en inglés):
- **Vendido — `soldAmount`** — suma de precios de [[#pasajero--passenger]] (lo **facturado**).
- **Cobrado — `collectedAmount`** — suma de pagos aprobados (la **caja real**).
- **Deuda — `debt`** = `soldAmount − collectedAmount` (la brecha del set filtrado).

Es **otra cosa** que el `currentBalance`/`overdueBalance` de [[#cliente--customer]], que son saldos
**por Cliente**; acá son **totales del set filtrado** del reporte.

**Netos de cancelaciones:** los ingresos (`soldAmount`, `collectedAmount`, `debt`, y el `soldAmount`
de cada bucket) cuentan **solo [[#pasajero--passenger]] activos**, aunque el filtro incluya
`Cancelled`. Los cancelados igual aparecen en la grilla y en `byStatus` (conteo); el reporte por
pasajero los expone aparte en `totals.cancelled` (conteo) y `totals.cancelledAmount` (monto dado de
baja, que **no** suma en `soldAmount`). El reporte por reserva ya era neto por diseño. El default de
estados **sigue incluyendo `Cancelled`** a propósito: la baja se ve, pero ya no infla las ventas.

> **Idioma del contrato:** los **nombres de campo** (grilla y summary) van en **inglés** —
> `totals`, `byStatus`, `byRoute`, `byDay`, `soldAmount`… Solo quedan en **español** los **valores
> de `label`** ("Confirmado", "Efectivo") y los headers del Excel (texto de display). El tipo TS es
> espejo exacto del wire; se traduce únicamente al renderizar.

### Cobranza — Pagos y Caja
Familia **separada** de la [[#reportería--análisis-sobre-un-rango]]: otro dominio (caja) y otra auth
(**Admin + Operator**). Vive bajo `cashbox/*` en la ruta `/admin/cashbox`. En el sidebar va
**agrupada** bajo el ítem "Reportería" como sub-item, pero es **ruta y auth aparte**: el sub-item
"Reservas" (`/admin/reporting`) es **Admin-only** y "Cobranza" es **Admin + Operator** (`user`). El
submenu filtra por rol, así un Operador ve el grupo con **sólo** "Cobranza" adentro. Dos reportes
conectados:
- **Pagos** (`cashbox/payments`): la fila es **un método** de un pago. Si un cobro se parte (ej.
  tarjeta + efectivo), salen **2 filas**. Orden default **cronológico** (`date` ascendente).
- **Caja** (`cashbox/report`): la fila es una caja (turno). El **drill-down** de una caja = el
  reporte de Pagos filtrado por su `cashBoxId`.

> ⚠️ **No existe "QR"** como método: un cobro por QR de MercadoPago entra como **Online (2)**.
> Métodos: `1` Efectivo, `2` Online (incl. QR), `3` Tarjeta, `4` Transferencia.
> Estados de pago: `1` Pendiente, `2` Pagado, `3` Cancelado, `4` Reintegrado, `5` Prepago.

---

## Doc canónica del contrato

La fuente de verdad del wire format y los errores vive en el repo del backend:

- `C:\Users\x\Documents\GitHub\transport-api\docs\FRONTEND_SERVICIOS_CLIENTE.md`
- `C:\Users\x\Documents\GitHub\transport-api\docs\adr\0001..0004-*.md`

Cualquier divergencia entre lo que escribís acá y esa doc, la doc gana.
