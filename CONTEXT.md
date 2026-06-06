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

## Doc canónica del contrato

La fuente de verdad del wire format y los errores vive en el repo del backend:

- `C:\Users\x\Documents\GitHub\transport-api\docs\FRONTEND_SERVICIOS_CLIENTE.md`
- `C:\Users\x\Documents\GitHub\transport-api\docs\adr\0001..0004-*.md`

Cualquier divergencia entre lo que escribís acá y esa doc, la doc gana.
