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
