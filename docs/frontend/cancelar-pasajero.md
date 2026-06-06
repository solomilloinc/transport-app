# Cancelar Pasajero — implementación frontend

**Estado:** implementado.
**Contrato completo (backend):** `transport-api/docs/frontend/cancelar-pasajero-api.md`
**ADR relacionado:** `docs/adr/0003-cancelar-y-eliminar-coexisten.md`

---

## Qué se construyó

### Nuevos archivos

| Archivo | Qué hace |
|---|---|
| `components/admin/reserves/CancelPassengerDialog.tsx` | Dialog de confirmación sin radios. Muestra el efecto exacto (saldo a favor / deuda a cero) e informa si se cancelan ambos tramos en el caso IdaVuelta. |
| `app/admin/reserves/actions.ts` _(ampliado)_ | `cancelPassengerAction` — Server Action que devuelve el error como **valor** (no como throw), para que el `code` del backend llegue al catálogo en producción. |

### Archivos modificados

| Archivo | Qué cambió |
|---|---|
| `components/admin/reserves/PassengerListTable.tsx` | Botón **Cancelar** (🚫) por fila, inline. Gating por fila: habilitado solo si `status ∈ {PendingPayment, Confirmed}` y `!reserveHasDeparted`. Botón **Eliminar** relegado al menú kebab `⋮`. |
| `app/admin/reserves/page.tsx` | Estado + handlers de Cancelar; prop `reserveHasDeparted` a la grilla; render de `CancelPassengerDialog`. |
| `interfaces/passengerReserve.ts` | Comentario de `reserveRelatedId` actualizado (gatea el aviso IdaVuelta en el dialog). |
| `lib/apiErrors.ts` | Tres códigos nuevos: `Passenger.NotFound` (ya existía), `Passenger.NotActive`, `Passenger.ReserveDeparted`. |
| `CONTEXT.md` | Sección "Dar de baja un Pasajero: `Cancelar` vs `Eliminar`" y "Cancelar es un término sobrecargado". |

---

## Decisiones de diseño

### Cancelar y Eliminar conviven (ver ADR 0003)
`passenger-cancel` no reemplaza a `customer-reserve-delete`. `Cancelar` es la baja canónica (el
backend decide el destino del dinero); `Eliminar` es el escape hatch destructivo (borrar sin rastro,
registrar como deuda). La jerarquía visual resuelve el solapamiento: **Cancelar inline**, **Eliminar
en el kebab `⋮`**.

### Dialog informativo, sin radios
`CancelPassengerDialog` no ofrece elegir el destino de la plata — el backend lo decide. Solo informa:
- Si pagó → *"el monto vuelve como saldo a favor"*
- Si no pagó → *"la deuda queda en cero"*
- Si es IdaVuelta → alerta adicional *"se cancelan ambos tramos"*

### Server Action con error como valor
`cancelPassengerAction` captura el error dentro del boundary del Server Action y lo devuelve como
`{ ok: false, code, message }`. Esto evita el masking de Next.js en producción (ver ADR 0001 y
`nextjs-server-action-error-masking.md` en memoria).

---

## Gating de la acción (por fila)

```ts
const status = passenger.status ?? passenger.statusPaymentId;
const isActive = status === PaymentStatusEnum.PendingPayment   // 1
              || status === PaymentStatusEnum.Confirmed;         // 2
const canCancel = isActive && !reserveHasDeparted;
```

`reserveHasDeparted` viene de `selectedTrip.hasDeparted` — es uniforme para toda la grilla.

---

## Errores mapeados en el catálogo

| Código (`title`) | HTTP | Copy en el catálogo |
|---|---|---|
| `Passenger.NotFound` | 404 | "El pasajero no fue encontrado." |
| `Passenger.NotActive` | 400 | "No se puede cancelar este pasajero porque no está activo..." |
| `Passenger.ReserveDeparted` | 400 | "No se puede cancelar este pasajero: el viaje ya partió." |

---

## Checklist (del charter del backend)

- [x] Grilla: acción **Cancelar** por fila (solo Admin).
- [x] Habilitada solo si `status ∈ {1, 2}` y la reserva no partió; deshabilitada en el resto.
- [x] Confirmación antes de cancelar. Aviso especial para IdaVuelta ("se cancelan ambos tramos").
- [x] Refrescar la grilla al volver (`fetchPassengerReserves`). El `currentBalance` puede quedar negativo (saldo a favor).
- [x] Códigos `Passenger.NotActive` y `Passenger.ReserveDeparted` mapeados en el catálogo (`lib/apiErrors.ts`).
