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
